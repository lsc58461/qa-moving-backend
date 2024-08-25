-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
