import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
// TODO: Come up with better name than Edit/Image Page?

export default function ImagePage() {
  // Need:
  // - uploaded image (stored locally on upload)
  // AND
  // - job id (to access mask from server)
  //   (need to pair with uploaded image to avoid mismatching masks)

  return (
    <div className="container min-h-screen">
      <Link to="/">
        <Button variant="destructive">Back to Upload</Button>
      </Link>
    </div>
  );
}