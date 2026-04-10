import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type { RequesterCatalogArea, RequesterCatalogWorkflow } from './catalog-types';

export async function buildRequesterCatalog(actorUserId: string): Promise<RequesterCatalogArea[]> {
  const db = getFirestore(getFirebaseAdminApp());

  const [areasSnap, typesSnap] = await Promise.all([
    db.collection('workflowAreas').get(),
    db
      .collection('workflowTypes_v2')
      .where('active', '==', true)
      .where('latestPublishedVersion', '!=', null)
      .get(),
  ]);

  const areasById = new Map(
    areasSnap.docs.map((doc) => [doc.id, doc.data() as { name?: string; icon?: string }]),
  );

  const visibleTypes = typesSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        workflowTypeId: data.workflowTypeId as string,
        name: data.name as string,
        description: data.description as string,
        icon: data.icon as string,
        areaId: data.areaId as string,
        allowedUserIds: data.allowedUserIds as string[] | undefined,
      };
    })
    .filter((item) => {
      const allowed = Array.isArray(item.allowedUserIds) ? item.allowedUserIds : [];
      return allowed.includes('all') || allowed.includes(actorUserId);
    });

  const grouped = new Map<string, RequesterCatalogWorkflow[]>();

  visibleTypes.forEach((item) => {
    const areaId = item.areaId;
    if (!areaId) return;
    if (!grouped.has(areaId)) grouped.set(areaId, []);
    grouped.get(areaId)!.push({
      workflowTypeId: item.workflowTypeId,
      name: item.name,
      description: item.description,
      icon: item.icon,
    });
  });

  return Array.from(grouped.entries())
    .map(([areaId, workflows]) => {
      const area = areasById.get(areaId);
      return {
        areaId,
        areaName: area?.name?.trim() || areaId,
        areaIcon: area?.icon?.trim() || undefined,
        workflows: workflows.sort((a, b) => a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.areaName.localeCompare(b.areaName));
}
