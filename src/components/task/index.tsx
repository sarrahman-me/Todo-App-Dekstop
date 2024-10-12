import { FaTrash } from "react-icons/fa6";

export default function Task({ id, task, completed, markComplete, deleteTask }: { id: number, task: string, completed: number, markComplete: (id: number) => void, deleteTask: (id: number) => void }) {
  return (
    <div onClick={() => markComplete(id)} className={`select-none flex justify-between ${completed ? "bg-gray-500 text-white" : "bg-white hover:shadow"} border rounded p-2`}>
      < div >
        <p className={completed ? "line-through" : ""}>{task}</p>
      </ div>
      <div className="flex items-center space-x-4">
        <FaTrash onClick={() => deleteTask(id)} className="text-slate-300 hover:text-red-500 cursor-pointer" />
      </div>
    </div>
  )
}
