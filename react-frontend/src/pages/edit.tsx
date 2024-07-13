import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
// TODO: Come up with better name than Edit/Image Page?

export default function ImagePage() {
  const { imgId } = useParams();

  return (
    <div className="container min-h-screen">
      <Link to="/">
        <Button variant="destructive">Back to Upload</Button>
      </Link>
    </div>
  );
}