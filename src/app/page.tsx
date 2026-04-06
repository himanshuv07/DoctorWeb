import Image from "next/image";
import { redirect } from "next/navigation";


export default function Home() {
  return (
    redirect("/login"),
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Main Page
    </div>
  );
}
