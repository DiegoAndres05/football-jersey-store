export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="skeleton h-10 w-40 rounded-lg mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
