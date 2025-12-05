import LogoutButton from "@/src/components/logout-button";

export default async function Dashboard() {

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>


      <LogoutButton />
    </div>
  );
}
