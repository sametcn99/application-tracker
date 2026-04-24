-- Preserve any legacy Comment rows as activity comments before dropping the unused table.
INSERT INTO "ActivityEntry" (
    "id",
    "applicationId",
    "type",
    "comment",
    "createdAt"
)
SELECT
    concat('comment_', md5(concat("Comment"."id", "Comment"."createdAt"::text))),
    "Comment"."applicationId",
    'COMMENT',
    "Comment"."content",
    "Comment"."createdAt"
FROM "Comment"
WHERE NOT EXISTS (
    SELECT 1
    FROM "ActivityEntry"
    WHERE "ActivityEntry"."id" = concat('comment_', md5(concat("Comment"."id", "Comment"."createdAt"::text)))
);

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_applicationId_fkey";

-- DropTable
DROP TABLE "Comment";
