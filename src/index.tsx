import html from '@elysiajs/html';
import { PrismaClient, Task } from '@prisma/client';
import { Elysia, t } from 'elysia';
import * as elements from 'typed-html';

const BaseHtml = ({ children }: elements.Children) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.5" integrity="sha384-xcuj3WpfgjlKF+FXhSQFQ0ZNr39ln+hwjN3npfM9VBnUskLolQAcN80McRIVOPuO" crossorigin="anonymous"></script>
    <title>Todo List</title>
  </head>
  <body class="flex justify-center items-center h-screen">
    ${children}
  </body>
</html>
`;

const prisma = new PrismaClient();

const app = new Elysia()
  .use(html())
  .get('/', async ({ html }) => {
    const tasks = await prisma.task.findMany();

    return html(
      <BaseHtml>
        <AllTasks tasks={tasks} />
      </BaseHtml>
    );
  })
  .post(
    '/',
    async ({ html, body: { name } }) => {
      await prisma.task.create({
        data: {
          name,
        },
      });
      const tasks = await prisma.task.findMany();

      return html(<AllTasks tasks={tasks} />);
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    }
  )
  .patch('/:id/complete', async ({ html, params: { id } }) => {
    let task = await prisma.task.findFirstOrThrow({
      where: {
        id: Number(id),
      },
    });
    task = await prisma.task.update({
      data: {
        completed: !task.completed,
      },
      where: {
        id: task.id,
      },
    });

    return html(<TaskItem task={task} />);
  })
  .delete('/:id', async ({ html, params: { id } }) => {
    await prisma.task.delete({
      where: {
        id: Number(id),
      },
    });

    return;
  })
  .listen(3000);

const TaskItem = ({ task }: { task: Task }) => {
  return (
    <div
      class="border-gray-300 border-b py-2 flex items-center justify-between"
      id="task">
      <p class={`${task.completed ? 'line-through' : ''}`}>{task.name}</p>

      <div class="flex items-center">
        <input
          class="ml-5 mr-2"
          type="checkbox"
          hx-patch={`/${task.id}/complete`}
          hx-swap="outerHTML"
          hx-target="closest #task"
          checked={task.completed}
        />

        <button
          hx-swap="outerHTML"
          hx-delete={`/${task.id}`}
          hx-target="closest #task">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            view-box="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
            class="w-6 h-6 text-red-500">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const AllTasks = ({ tasks }: { tasks: Task[] }) => {
  return (
    <div id="tasks">
      {tasks.map((task) => (
        <TaskItem task={task} />
      ))}

      <div class="mt-4">
        <form hx-post="/" hx-target="closest #tasks" hx-swap="outerHTML">
          <input
            class="border border-gray-300 rounded-full w-full mb-2"
            type="text"
            name="name"
          />

          <button class="w-full px-3 py-1 bg-black text-white rounded-full">
            Create task
          </button>
        </form>
      </div>
    </div>
  );
};

console.log('Server started at: http://localhost:3000');
