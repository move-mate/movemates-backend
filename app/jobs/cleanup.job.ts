// // src/jobs/cleanup.job.ts
// import cron from 'node-cron';
// import { cleanupBlacklist } from '../services/auth.service';

// // Schedule cleanup job to run daily at 3 AM
// export const scheduleCleanupJobs = (): void => {
//   // Run daily at 3 AM
//   cron.schedule('0 3 * * *', async () => {
//     try {
//       console.log('Running token blacklist cleanup job...');
//       const deletedCount = await cleanupBlacklist();
//       console.log(`Cleaned up ${deletedCount} expired blacklisted tokens`);
//     } catch (error) {
//       console.error('Failed to run cleanup job:', error);
//     }
//   });
  
//   console.log('Scheduled token blacklist cleanup job');
// };