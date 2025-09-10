import ContractTemplateUploader from '../components/ContractTemplateUploader';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export default function ContractTemplatesPage() {
  return <ContractTemplateUploader />;
}
