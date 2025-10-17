import QueryInput from "@/components/queryInput";
import TextInput from "@/components/textInput";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-10">
      <TextInput />
      <QueryInput />
    </div>
  );
}
