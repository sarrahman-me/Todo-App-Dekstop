import { FormEvent, useEffect, useState } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { ITask } from "./interface/task";
import { Task } from "./components";
import { Confirm } from "notiflix";
import moment from "moment";

function App() {
  const [todos, setTodos] = useState<ITask[]>([]);
  const [task, setTask] = useState("");
  const [query, setQuery] = useState("");


  useEffect(() => {
    async function getTodos() {
      try {
        const data: ITask[] = await invoke("get_todos");
        setTodos(data)
      } catch (err) {
        console.error(Error)
      }
    }

    getTodos()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (task.trim() == "") return

    try {
      await invoke("add_todo", { task })
      setTask("")
      const data: ITask[] = await invoke("get_todos");
      setTodos(data)
    } catch (error) {
      console.error(Error)
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()

    try {
      const data: ITask[] = await invoke("get_todos", { query });
      setTodos(data)
    } catch (err) {
      console.error(Error)
    }
  }


  async function markAsComplete(id: number) {
    try {
      await invoke("mark_as_complete", { id })
      const data: ITask[] = await invoke("get_todos");
      setTodos(data)
    } catch (error) {
      console.error(error)
    }
  }


  function deleteTask(id: number) {
    Confirm.show(
      'Konfirmasi',
      'Yakin untuk menghapus task',
      'Hapus',
      'Jangan',
      async () => {
        try {
          await invoke("delete_task", { id })
          const data: ITask[] = await invoke("get_todos");
          setTodos(data)
        } catch (error) {
          console.error(error)
        }
      },
      () => { },
      {
        titleColor: "red",
        okButtonBackground: "red",
        borderRadius: "6px"
      }
    );
  }


  return (
    <div className="h-screen bg-cover bg-center bg-[url('../public/walpaper.jpg')]">
      <div className="flex max-w-4xl mx-auto flex-col justify-between h-full w-full bg-black/20">
        <div className="p-2 space-y-7">

          {/*Bagian App Bar*/}
          <div className="">
            <p className="text-white font-bold text-2xl">My Day</p>
            <p className="text-white">{moment().format("lll")}</p>
          </div>

          {/*Bagian Search Task*/}
          <form onSubmit={handleSearch} className="flex justify-center">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded p-2 w-1/2" placeholder="Search task..." />
            <button type="submit" className="border rounded ml-1 p-1.5 bg-white">Search</button>
          </form>

          {/*Bagian List Task*/}
          <section className="space-y-2">
            {todos.map((todo) => (
              <Task task={todo.task} completed={todo.completed} key={todo.id} id={todo.id} markComplete={markAsComplete} deleteTask={deleteTask} />
            ))}
          </section>
        </div>

        {/*Bagian form add task*/}
        <form className="flex p-2" onSubmit={handleSubmit}>
          <input value={task} type="text" onChange={(e) => setTask(e.target.value)} className="border rounded p-2 w-full" placeholder="Add a Task" />
          <button type="submit" className="border rounded p-2 ml-2 bg-white">Add</button>
        </form>

      </div>
    </div>
  );
}

export default App;
