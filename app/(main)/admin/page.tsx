import AdminStatusPanel from '@/components/AdminStatusPanel';
import { getIngestLog } from '@/lib/ingest';
import { getCatalogStats } from '@/lib/catalog-queries';

export default function AdminPage() {
  const initialStatus = {
    log: getIngestLog(10),
    stats: getCatalogStats(),
  };

  return <AdminStatusPanel initialStatus={initialStatus} />;
}
