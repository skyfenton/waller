import { useEffect, useState } from 'react';
import UploadPage from '@/pages/upload';
import EditPage from '@/pages/edit';
import { StoredWallerJob, WallerJob } from '@/types';

export default function App() {
  const [job, setJob] = useState<WallerJob>();

  // Load job from session storage on component mount
  useEffect(() => {
    const storedJson = sessionStorage.getItem('job');
    if (storedJson) {
      const storedJob = JSON.parse(storedJson) as StoredWallerJob;
      const newJob: WallerJob = {...storedJob, image: new File([storedJob.image.data], storedJob.image.fileName)}
      
      Object.assign(newJob.image, {
        preview: URL.createObjectURL(newJob.image)
      });
      setJob(newJob);
    }
  }, []);

  // Save job to session storage on job change
  useEffect(() => {
    if (job) {
      job.image.text().then( (res) => {
        const serialized: StoredWallerJob = {...job, image: { fileName: job.image.name, data: res } };
        // console.debug(JSON.stringify(serialized));
        sessionStorage.setItem('job', JSON.stringify(serialized));
      }
      ).catch((err) => {console.error(err)})
    }
  }, [job]);

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
      {job?.processed ? (
        <EditPage job={job} setJob={setJob} />
      ) : (
        <UploadPage job={job} setJob={setJob} />
      )}
    </>
  );
}
