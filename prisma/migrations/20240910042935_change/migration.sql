-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;
