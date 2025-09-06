import { trpc } from '../utils/trpc';

export default function Home() {
  const hello = trpc.getImageSuggestions.useQuery({ imageBase64: '', numSuggestions: 10 });
  if (!hello.data) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <p>{hello.data.greeting}</p>
    </div>
  );
}