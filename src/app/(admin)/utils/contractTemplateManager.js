/**
 * Contract Template Manager
 * Handles uploading, storing, and retrieving contract templates from Firebase Storage
 */

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from "firebase/storage";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  where,
  orderBy 
} from "firebase/firestore";
import { db, storage } from "../../../../script/firebaseConfig";

/**
 * Upload a contract template document to Firebase Storage
 * @param {File} file - The contract template file (PDF, DOC, DOCX, etc.)
 * @param {string} templateName - Name for the template
 * @param {string} templateType - Type of template (dedicated, private, virtual)
 * @param {string} description - Description of the template
 * @returns {Promise<Object>} - Upload result with download URL and metadata
 */
export async function uploadContractTemplate(file, templateName, templateType, description = '') {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `contract-templates/${templateType}/${templateName}_${timestamp}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Save template metadata to Firestore
    const templateData = {
      name: templateName,
      type: templateType,
      description: description,
      fileName: fileName,
      originalFileName: file.name,
      downloadURL: downloadURL,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      isActive: true,
      version: '1.0'
    };
    
    const docRef = await addDoc(collection(db, 'contractTemplates'), templateData);
    
    return {
      success: true,
      templateId: docRef.id,
      downloadURL: downloadURL,
      metadata: templateData
    };
    
  } catch (error) {
    console.error('Error uploading contract template:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all contract templates
 * @param {string} templateType - Optional filter by template type
 * @returns {Promise<Array>} - Array of template objects
 */
export async function getContractTemplates(templateType = null) {
  try {
    let q = query(
      collection(db, 'contractTemplates'),
      orderBy('uploadedAt', 'desc')
    );
    
    if (templateType) {
      q = query(
        collection(db, 'contractTemplates'),
        where('type', '==', templateType),
        orderBy('uploadedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const templates = [];
    
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return templates;
    
  } catch (error) {
    console.error('Error getting contract templates:', error);
    return [];
  }
}

/**
 * Get active contract template for a specific type
 * @param {string} templateType - Type of template (dedicated, private, virtual)
 * @returns {Promise<Object|null>} - Active template object or null
 */
export async function getActiveContractTemplate(templateType) {
  try {
    const q = query(
      collection(db, 'contractTemplates'),
      where('type', '==', templateType),
      where('isActive', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
    
  } catch (error) {
    console.error('Error getting active contract template:', error);
    return null;
  }
}

/**
 * Update template metadata
 * @param {string} templateId - Template document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateContractTemplate(templateId, updates) {
  try {
    const templateRef = doc(db, 'contractTemplates', templateId);
    await updateDoc(templateRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return true;
    
  } catch (error) {
    console.error('Error updating contract template:', error);
    return false;
  }
}

/**
 * Delete a contract template
 * @param {string} templateId - Template document ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteContractTemplate(templateId) {
  try {
    // Get template data first
    const templateRef = doc(db, 'contractTemplates', templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }
    
    const templateData = templateDoc.data();
    
    // Delete file from Storage
    const storageRef = ref(storage, templateData.fileName);
    await deleteObject(storageRef);
    
    // Delete document from Firestore
    await deleteDoc(templateRef);
    
    return true;
    
  } catch (error) {
    console.error('Error deleting contract template:', error);
    return false;
  }
}

/**
 * Set a template as active (deactivates others of the same type)
 * @param {string} templateId - Template document ID
 * @returns {Promise<boolean>} - Success status
 */
export async function setActiveTemplate(templateId) {
  try {
    // Get template data
    const templateRef = doc(db, 'contractTemplates', templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }
    
    const templateData = templateDoc.data();
    
    // Deactivate all templates of the same type
    const q = query(
      collection(db, 'contractTemplates'),
      where('type', '==', templateData.type)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = [];
    
    querySnapshot.forEach((doc) => {
      updatePromises.push(
        updateDoc(doc.ref, { isActive: false })
      );
    });
    
    await Promise.all(updatePromises);
    
    // Activate the selected template
    await updateDoc(templateRef, { 
      isActive: true,
      activatedAt: new Date().toISOString()
    });
    
    return true;
    
  } catch (error) {
    console.error('Error setting active template:', error);
    return false;
  }
}

/**
 * Download contract template file
 * @param {string} downloadURL - Template download URL
 * @param {string} fileName - Original file name
 * @returns {Promise<void>}
 */
export async function downloadContractTemplate(downloadURL, fileName) {
  try {
    const response = await fetch(downloadURL);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading contract template:', error);
    throw error;
  }
}

/**
 * Get template statistics
 * @returns {Promise<Object>} - Template statistics
 */
export async function getTemplateStatistics() {
  try {
    const templates = await getContractTemplates();
    
    const stats = {
      total: templates.length,
      byType: {
        dedicated: 0,
        private: 0,
        virtual: 0
      },
      active: 0,
      totalSize: 0
    };
    
    templates.forEach(template => {
      stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
      if (template.isActive) stats.active++;
      stats.totalSize += template.fileSize || 0;
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting template statistics:', error);
    return {
      total: 0,
      byType: { dedicated: 0, private: 0, virtual: 0 },
      active: 0,
      totalSize: 0
    };
  }
}
