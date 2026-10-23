/**
 * Pushes every stored message to Meilisearch, e.g. after enabling search or wiping the index.
 * Safe to rerun: documents are replaced by id. Run with `pnpm search:reindex`.
 */
import { meilisearchConfig } from "../config/meilisearch.config";
import { database } from "../lib/database";
import { MeilisearchMessageIndexer } from "../modules/community/provider/meilisearch-message-indexer.adapter";

const BATCH_SIZE = 1000;

async function main() {
  if (!meilisearchConfig) {
    throw new Error("MEILISEARCH_HOST et MEILISEARCH_API_KEY doivent être définis.");
  }
  const indexer = new MeilisearchMessageIndexer(meilisearchConfig);

  let cursor: string | undefined;
  let total = 0;
  for (;;) {
    const records = await database.message.findMany({
      include: {
        author: { select: { pseudo: true } },
        subGroup: { select: { communityId: true } },
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    if (records.length === 0) break;

    await indexer.index(
      records.map((record) => ({
        id: record.id,
        communityId: record.subGroup.communityId,
        subGroupId: record.subGroupId,
        authorId: record.authorId,
        authorPseudo: record.author.pseudo,
        text: record.text,
        rainbowSyncStatus: record.rainbowSyncStatus,
        createdAt: record.createdAt,
      })),
    );
    total += records.length;
    cursor = records[records.length - 1]?.id;
    console.log(`${total} messages envoyés à Meilisearch…`);
  }

  console.log(`Terminé : ${total} messages envoyés (indexation asynchrone côté Meilisearch).`);
}

try {
  await main();
} finally {
  await database.$disconnect();
}
