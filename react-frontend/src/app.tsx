import { useEffect, useState } from 'react';
import UploadPage from '@/pages/upload';
import EditPage from '@/pages/edit';
import { isJobDone, WallerJob } from '@/types';

export default function App() {
  const [job, setJob] = useState<WallerJob>();

  // // Load job from session storage on component mount
  // useEffect(() => {
  //   const storedJob = sessionStorage.getItem('job');
  //   if (storedJob) {
  //     setJob(JSON.parse(storedJob) as WallerJob);
  //   }
  // }, []);

  // // Save job to session storage on job change
  // useEffect(() => {
  //   if (job) {
  //     sessionStorage.setItem('job', JSON.stringify(job));
  //   }
  // }, [job]);

  // TODO: Redirect all routes to / (for cosmetics, really)

  // const router = createBrowserRouter([
  //   {
  //     path: '/',
  //     element: <Navigate to="/upload" />,
  //     errorElement: <NotFoundPage />
  //     // loader: rootLoader,
  //   },
  //   {
  //     path: '/edit',
  //     element: <EditPage />
  //   }
  // ]);

  // return <RouterProvider router={router} />;
  return (
    <>
      {job && isJobDone(job) ? (
        <EditPage job={job} setJob={setJob} />
      ) : (
        <UploadPage job={job} setJob={setJob} />
      )}
    </>
  );
}
