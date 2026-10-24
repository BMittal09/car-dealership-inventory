import { useParams } from "react-router";

export default function CarDetailsPage() {
  const { id } = useParams();

  return (
    <section>
      <h1 className="text-3xl font-bold">Vehicle Details</h1>
      <p className="mt-3 text-slate-600">Vehicle ID: {id}</p>
    </section>
  );
}
