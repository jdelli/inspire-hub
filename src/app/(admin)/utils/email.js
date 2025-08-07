import emailjs from '@emailjs/browser';

export const sendAcceptanceEmail = async (clientData) => {
  try {
    let seatInfo = clientData.reservedSeats?.join(', ') || 'Not specified';
    if (clientData.area) {
      seatInfo += ` (Office: ${clientData.area})`;
    }

    const templateParams = {
      to_email: clientData.email,
      to_name: clientData.name,
      company: clientData.company,
      date: clientData.date?.seconds
        ? new Date(clientData.date.seconds * 1000).toLocaleString()
        : new Date(clientData.date).toLocaleString(),
      reserved_seats: seatInfo, // Now combines seats and area
    };

    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_DESK_ID,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};

export const sendRejectionEmail = async (clientData, reason) => {
  try {
    const templateParams = {
      to_email: clientData.email,
      to_name: clientData.name,
      company: clientData.company,
      rejection_reason: reason,
      current_year: new Date().getFullYear(), // Add this line
    };

    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_REJECTION_TEMPLATE_ID,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return { success: false, error };
  }
};





// for meeting room acceptance
export const sendMeetingAcceptanceEmail = async (reservationData) => {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error(
      'EmailJS Service ID, Template ID, or Public Key is not defined. Please check your .env file.'
    );
    throw new Error('Email service configuration error.');
  }

  // Format the totalCost for display in the email
  const formattedTotalCost = reservationData.totalCost
    ? reservationData.totalCost.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
    : 'N/A';

  const templateParams = {
    to_name: reservationData.name,
    to_email: reservationData.email,
    meeting_date: new Date(reservationData.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    from_time: formatTime24h(reservationData.from_time),
    to_time: formatTime24h(reservationData.to_time),
    duration: reservationData.duration,
    guests: Array.isArray(reservationData.guests)
      ? reservationData.guests.join(', ')
      : typeof reservationData.guests === 'string'
      ? reservationData.guests
      : 'N/A',
    total_cost: formattedTotalCost, // <--- Add this line
    // You might also want to add the room name for clarity in the email
    room_name: reservationData.room, // <--- Add this line if 'room' is available in reservationData
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Meeting acceptance email successfully sent!');
    return { success: true };
  } catch (error) {
    console.error('Failed to send meeting acceptance email:', error);
    throw new Error(`Failed to send email notification: ${error.message}`);
  }
};

// Helper function to convert time string or Firestore Timestamp to 24h format
function formatTime24h(time) {
  if (!time) return '';

  let dateObj;

  // If time is a Firestore Timestamp object (has 'seconds' property)
  if (typeof time === 'object' && time !== null && 'seconds' in time) {
    dateObj = new Date(time.seconds * 1000);
  } else if (typeof time === 'string') {
    // Handle string formats like "1:00 PM", "7:00 AM", or "13:00"
    const pmMatch = time.match(/(\d{1,2}):(\d{2})\s*pm/i);
    const amMatch = time.match(/(\d{1,2}):(\d{2})\s*am/i);
    let hour, min;

    if (pmMatch) {
      hour = parseInt(pmMatch[1], 10);
      min = parseInt(pmMatch[2], 10);
      if (hour < 12) hour += 12; // Convert PM hours (e.g., 1 PM to 13)
    } else if (amMatch) {
      hour = parseInt(amMatch[1], 10);
      min = parseInt(amMatch[2], 10);
      if (hour === 12) hour = 0; // Convert 12 AM to 0 (midnight)
    } else if (time.includes(':')) {
      // Assume 24-hour format if no AM/PM and has colon
      [hour, min] = time.split(':').map(Number);
    } else {
      // If it's just an hour like "07", assume minutes are 00
      hour = parseInt(time, 10);
      min = 0;
    }

    dateObj = new Date(); // Use current date, but set hours and minutes
    dateObj.setHours(hour, min, 0, 0);
  } else {
    return String(time); // Return as string if format is unexpected
  }

  const hh = dateObj.getHours().toString().padStart(2, '0');
  const mm = dateObj.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}







// For Expiry Tenants
export const sendSubscriptionExpiryNotification = async (client) => {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_EXPIRY_ID;

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error(
      'EmailJS Service ID, Template ID, or Public Key is not defined. Please check your .env file.'
    );
    throw new Error('Email service configuration error.');
  }

  const templateParams = {
    to_name: client.name,
    to_email: client.email,
    company: client.company || 'N/A',
    expiry_date: client.expiry_date // Now using the pre-formatted date from the hook
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Subscription expiry notification sent!');
    return { success: true };
  } catch (error) {
    console.error('Failed to send subscription expiry notification:', error);
    return { success: false, error };
  }
};






// Dedicated Desk Booking Notification to Admin
export async function sendBookingEmail(bookingDetails) {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN_BOOKING_ID;


  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error("EmailJS environment variables are not set.");
    // Optionally throw an error or return false to indicate failure
    throw new Error("Email service not configured. Please check environment variables.");
  }

  const templateParams = {
    client_name: bookingDetails.name,
    client_email: bookingDetails.email,
    client_phone: bookingDetails.phone,
    client_company: bookingDetails.company,
    visit_date: bookingDetails.date,
    client_details: bookingDetails.details,
    reserved_seats: bookingDetails.selectedSeats.join(", "), // Join array into a string
    // Add any other parameters your EmailJS template expects
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("Email successfully sent to admin!");
    return true; // Indicate success
  } catch (error) {
    console.error("Failed to send email to admin:", error);
    throw error; // Re-throw the error to be caught by the calling component
  }
}




// Meeting Room Reservation Notification to Admin
export const sendReservationEmail = async (reservationDetails) => {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADMIN_RESERVATION_ID;


    // Basic validation for environment variables
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.error("EmailJS environment variables are not set up correctly.");
        // Depending on your needs, you might want to throw an error or return false
        return false;
    }

    // Prepare template parameters based on your EmailJS template
    const templateParams = {
        room_name: reservationDetails.room,
        reservation_date: reservationDetails.date,
        reservation_time: `${reservationDetails.from_time} - ${reservationDetails.to_time}`,
        reservation_duration: reservationDetails.duration,
        client_name: reservationDetails.name,
        client_email: reservationDetails.email,
        client_phone: reservationDetails.phone || 'N/A',
        guest_list: reservationDetails.guests.length > 0 ? reservationDetails.guests.join(', ') : 'No guests',
        special_requests: reservationDetails.specialRequests || 'None',
        total_cost: reservationDetails.totalCost.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }),
    };

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('Email successfully sent!', response.status, response.text);
        return true; // Indicate success
    } catch (err) {
        console.error('Failed to send email:', err);
        return false; // Indicate failure
    }
};




// Private office notification to admin
export async function sendPrivateOfficeBookingEmail(bookingDetails) {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PRIVATE_OFFICE_ID; // NEW TEMPLATE ID

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error("EmailJS environment variables are not set for private office booking.");
    throw new Error("Email service not configured. Please check environment variables.");
  }

  const templateParams = {
    client_name: bookingDetails.name,
    client_email: bookingDetails.email,
    client_phone: bookingDetails.phone,
    visit_date: bookingDetails.date,
    visit_time: bookingDetails.time,
    booked_offices: bookingDetails.selectedOffices.join(", "), // Array joined into string
    // You can add more parameters here if your new template needs them
    // e.g., client_company: bookingDetails.company || 'N/A',
    // e.g., client_details: bookingDetails.details || 'None',
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("Private office booking email successfully sent to admin!");
    return true; // Indicate success
  } catch (error) {
    console.error("Failed to send private office booking email to admin:", error);
    throw error; // Re-throw the error to be caught by the calling component
  }
}



// for virtual office inquiry notification to admin
export async function sendVirtualOfficeInquiryEmail(inquiryDetails) {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_VIRTUAL_OFFICE_INQUIRY_ID;

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error("EmailJS environment variables are not fully set for virtual office inquiry.");
    throw new Error("Email service not configured. Please check environment variables.");
  }

  const templateParams = {
    client_name: inquiryDetails.name,
    client_email: inquiryDetails.email,
    client_phone: inquiryDetails.phone,
    client_company: inquiryDetails.company || "N/A", // Default to N/A if not provided
    client_position: inquiryDetails.position || "N/A", // Default to N/A if not provided
    client_address: inquiryDetails.address || "N/A", // Default to N/A if not provided
    // Add any other fields from your form that you want in the email
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("Virtual office inquiry email successfully sent to admin!");
    return true; // Indicate success
  } catch (error) {
    console.error("Failed to send virtual office inquiry email to admin:", error);
    throw error; // Re-throw the error to be caught by the calling component
  }
}

// Billing notification to tenants
export async function sendBillingNotification(billingRecord, type = 'monthly') {
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = type === 'overdue' 
    ? process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_OVERDUE_BILLING_ID
    : process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_MONTHLY_BILLING_ID;

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error("EmailJS environment variables are not set for billing notifications.");
    throw new Error("Email service not configured. Please check environment variables.");
  }

  // Format the billing month for display
  const billingMonth = billingRecord.billingMonth;
  const [year, month] = billingMonth.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formattedMonth = `${monthNames[parseInt(month) - 1]} ${year}`;

  // Format due date
  const dueDate = new Date(billingRecord.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate days until due
  const currentDate = new Date();
  const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));

  // Format currency
  const formatCurrency = (amount) => {
    return `₱${Number(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const templateParams = {
    to_name: billingRecord.tenantName,
    to_email: billingRecord.tenantEmail,
    company_name: billingRecord.tenantCompany,
    billing_month: formattedMonth,
    due_date: formattedDueDate,
    days_until_due: daysUntilDue,
    total_amount: formatCurrency(billingRecord.total),
    subtotal: formatCurrency(billingRecord.subtotal),
    vat_amount: formatCurrency(billingRecord.vat),
    billing_id: billingRecord.id,
    tenant_type: billingRecord.tenantType,
    payment_method: billingRecord.paymentMethod,
    billing_address: billingRecord.billingAddress,
    
    // Items breakdown
    items_breakdown: billingRecord.items.map(item => 
      `${item.description}: ${item.quantity} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.amount)}`
    ).join('\n'),
    
    // Additional context based on type
    notification_type: type === 'overdue' ? 'Overdue Payment Reminder' : 'Monthly Billing Statement',
    urgency_message: type === 'overdue' 
      ? 'Your payment is overdue. Please settle your account immediately to avoid service interruption.'
      : `Your monthly billing statement for ${formattedMonth} is ready. Payment is due by ${formattedDueDate}.`
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`${type} billing notification sent to ${billingRecord.tenantEmail}!`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send ${type} billing notification to ${billingRecord.tenantEmail}:`, error);
    throw error;
  }
}