import { createFileRoute } from "@tanstack/react-router";
import {
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  GripVertical,
  LayoutDashboard,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, lazy, Suspense, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

const DrawnixBoard = lazy(() => import("../components/DrawnixBoard"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The One Thing — Không gian lập kế hoạch trực quan" },
      {
        name: "description",
        content: "Lập kế hoạch bằng sơ đồ tư duy và ưu tiên công việc với ma trận Eisenhower.",
      },
    ],
  }),
  component: Workspace,
});

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

function IconButton({ label, children, className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border border-outline text-muted-foreground transition hover:border-primary/60 hover:bg-accent hover:text-foreground ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const MENU_WIDTH = 148;
const MENU_HEIGHT = 78;

function TaskMenu({ open, onToggle, onClose, onEdit, onDelete }: any) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const handleToggle = () => {
    if (open) {
      onClose();
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > MENU_HEIGHT + 12 ? rect.bottom + 6 : Math.max(8, rect.top - MENU_HEIGHT - 6);
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    setCoords({ top, left });
    onToggle();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`grid h-7 w-6 shrink-0 place-items-center rounded-md border transition hover:border-primary/60 hover:bg-accent hover:text-foreground ${open ? "border-primary/60 bg-accent text-foreground" : "border-outline text-muted-foreground"}`}
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {open && coords && (
        <div
          ref={menuRef}
          className="fixed z-50 flex flex-col rounded-md border border-outline bg-surface p-1 shadow-panel"
          style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
        >
          <button
            onClick={() => { onClose(); onEdit(); }}
            className="flex h-8 items-center gap-2 rounded-sm px-2 text-left text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            <Pencil className="size-3.5 text-primary" /> Sửa tên
          </button>
          <button
            onClick={() => { onClose(); onDelete(); }}
            className="flex h-8 items-center gap-2 rounded-sm px-2 text-left text-xs font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" /> Xóa việc
          </button>
        </div>
      )}
    </>
  );
}

const quadrants = [
  { id: "do", title: "Làm ngay", tone: "danger", tasks: [{ id: "task-1", title: "Hoàn thiện bản kế hoạch", completed: false }] },
  { id: "schedule", title: "Lên lịch", tone: "info", tasks: [{ id: "task-2", title: "Nghiên cứu người dùng", completed: false }] },
  { id: "delegate", title: "Ủy quyền", tone: "warning", tasks: [] },
  { id: "delete", title: "Loại bỏ", tone: "lavender", tasks: [] },
];



import { getMaps, createMap, deleteMap, renameMap, type MapData } from "../mapsApi";

function Workspace() {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [activeMapId, setActiveMapId] = useState<string>("");
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);
  
  const [matrix, setMatrix] = useState(quadrants);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  
  useEffect(() => {
    getMaps().then((loadedMaps) => {
      setMaps(loadedMaps);
      if (loadedMaps.length > 0) setActiveMapId(loadedMaps[0].id);
      setIsLoadingMaps(false);
    });
  }, []);

  const handleCreateMap = async () => {
    const name = window.prompt("Nhập tên sơ đồ mới:", "Sơ đồ mới");
    if (!name) return;
    const newMap = await createMap({ data: { name } });
    setMaps((prev) => [newMap, ...prev]);
    setActiveMapId(newMap.id);
  };

  const handleRenameMap = async (id: string, oldName: string) => {
    const newName = window.prompt("Đổi tên sơ đồ:", oldName);
    if (!newName || newName === oldName) return;
    await renameMap({ data: { id, name: newName } });
    setMaps((prev) => prev.map((m) => (m.id === id ? { ...m, name: newName } : m)));
  };

  const handleDeleteMap = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sơ đồ này?")) return;
    await deleteMap({ data: { id } });
    setMaps((prev) => {
      const newMaps = prev.filter((m) => m.id !== id);
      if (activeMapId === id && newMaps.length > 0) setActiveMapId(newMaps[0].id);
      return newMaps;
    });
  };
  
  const [isDesktop, setIsDesktop] = useState(false);
  const nextTaskId = useRef(3);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const mindMapPanel = (
    <section className="relative h-full min-h-[55vh] overflow-hidden bg-canvas">
      {isLoadingMaps || !activeMapId ? (
        <div className="grid h-full w-full place-items-center bg-canvas text-muted-foreground text-sm font-semibold">
          {isLoadingMaps ? "Đang tải thư viện..." : "Chưa chọn sơ đồ nào"}
        </div>
      ) : (
        <Suspense fallback={<div className="grid h-full w-full place-items-center bg-canvas text-muted-foreground text-sm font-semibold">Đang tải không gian vẽ...</div>}>
          <DrawnixBoard key={activeMapId} mapId={activeMapId} />
        </Suspense>
      )}
    </section>
  );


  const addTask = (quadrantId: string) => {
    const id = `task-${nextTaskId.current}`;
    nextTaskId.current += 1;
    setMatrix((items) =>
      items.map((item) =>
        item.id === quadrantId
          ? { ...item, tasks: [...item.tasks, { id, title: `Công việc mới ${item.tasks.length + 1}`, completed: false }] }
          : item,
      ),
    );
    setEditingTaskId(id);
    setEditingTitle("");
  };

  const moveTask = (taskId: string, sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setMatrix((items) => {
      const task = items.flatMap((item) => item.tasks).find((entry) => entry.id === taskId);
      if (!task) return items;
      return items.map((item) => {
        if (item.id === sourceId) return { ...item, tasks: item.tasks.filter((entry) => entry.id !== taskId) };
        if (item.id === targetId) return { ...item, tasks: [...item.tasks, task] };
        return item;
      });
    });
  };

  const updateTask = (taskId: string, changes: any) => {
    setMatrix((items) => items.map((item) => ({
      ...item,
      tasks: item.tasks.map((task) => task.id === taskId ? { ...task, ...changes } : task),
    })));
  };

  const matrixPanel = (
    <aside className="flex h-full min-h-[42rem] flex-col bg-workspace p-4 lg:min-h-0 lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-xl font-extrabold">Ma trận Eisenhower</h2>
        <span className="shrink-0 rounded-md border border-outline px-2 py-1 text-xs text-muted-foreground">Kéo &amp; thả</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
        {matrix.map((quadrant) => (
          <section
            key={quadrant.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
               const taskId = event.dataTransfer.getData("taskId");
               const source = event.dataTransfer.getData("source");
               if(taskId && source) { moveTask(taskId, source, quadrant.id); }
            }}
            className={`matrix-cell matrix-${quadrant.tone} flex min-h-0 flex-col overflow-hidden`}
          >
            <strong className="text-sm font-extrabold">{quadrant.title}</strong>
            <div className="mt-3 space-y-2 overflow-auto">
              {quadrant.tasks.map((task: any) => (
                <div
                  key={task.id}
                  draggable={editingTaskId !== task.id && menuTaskId !== task.id}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("taskId", task.id);
                    event.dataTransfer.setData("source", quadrant.id);
                  }}
                  className="grid min-h-11 grid-cols-[auto_minmax(2.5rem,1fr)_auto] items-center gap-1 rounded-md border border-outline/70 bg-task p-1.5"
                >
                  <button
                    type="button"
                    onClick={() => updateTask(task.id, { completed: !task.completed })}
                    className={`grid size-6 shrink-0 place-items-center rounded-sm border transition ${task.completed ? "border-primary bg-primary text-primary-foreground" : "border-outline text-transparent hover:border-primary"}`}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </button>
                  {editingTaskId === task.id ? (
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onBlur={() => {
                        updateTask(task.id, { title: editingTitle.trim() || task.title });
                        setEditingTaskId(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") setEditingTaskId(null);
                      }}
                      className="min-w-0 rounded-sm border border-primary bg-surface px-2 py-1 text-xs font-semibold text-foreground outline-none"
                    />
                  ) : (
                    <span className={`min-w-0 truncate text-xs font-semibold ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </span>
                  )}
                  <TaskMenu
                    open={menuTaskId === task.id}
                    onToggle={() => setMenuTaskId(task.id)}
                    onClose={() => setMenuTaskId((current) => (current === task.id ? null : current))}
                    onEdit={() => { setEditingTaskId(task.id); setEditingTitle(task.title); }}
                    onDelete={() => setMatrix((items) => items.map((item) => ({ ...item, tasks: item.tasks.filter((t) => t.id !== task.id) })))}
                  />
                </div>
              ))}
            </div>
            <button onClick={() => addTask(quadrant.id)} className="mt-auto flex items-center gap-1 pt-3 text-xs font-bold text-muted-foreground transition hover:text-foreground">
              <Plus className="size-3" /> Thêm việc
            </button>
          </section>
        ))}
      </div>
    </aside>
  );

  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      <header
        className={`grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-outline bg-topbar px-4 transition-[margin] duration-200 lg:px-6 ${sidebarOpen ? "lg:ml-60" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <IconButton
            label={sidebarOpen ? "Đóng thư viện" : "Mở thư viện"}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
          </IconButton>
          <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground sm:text-base">
            Tập trung vào điều quan trọng nhất{" "}
            <span className="font-extrabold text-primary">(Domino)</span>.
          </p>
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-2">
          <button className="hidden h-10 items-center gap-2 rounded-md border border-outline bg-surface px-3 text-sm font-semibold transition hover:bg-accent sm:flex">
            <span className="grid size-6 place-items-center rounded-full bg-profile text-xs">D</span>
            <span className="hidden xl:inline">Dương Hoàng Tuấn</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          <IconButton label="Trợ giúp"><CircleHelp className="size-4" /></IconButton>
        </div>
      </header>

      {sidebarOpen && (
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-outline bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-outline px-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Command className="size-6" /></div>
          <strong className="min-w-0 truncate text-lg font-extrabold">The One Thing</strong>
        </div>
        <nav className="space-y-2 p-4">
          <button className="flex h-11 w-full items-center gap-3 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">
            <LayoutDashboard className="size-5" /> Không gian làm việc
          </button>
          <button className="flex h-11 w-full items-center gap-3 rounded-md px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground">
            <CalendarDays className="size-5" /> Lịch công việc
          </button>
        </nav>
        <div className="mx-5 border-t border-outline" />
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <span className="text-xs font-bold uppercase text-muted-foreground">Thư viện</span>
          <IconButton label="Tạo sơ đồ mới" onClick={handleCreateMap}><Plus className="size-4" /></IconButton>
        </div>
        <div className="px-3 flex-1 overflow-y-auto space-y-1">
          {maps.length === 0 && !isLoadingMaps && (
            <div className="text-center text-xs text-muted-foreground p-3">Thư viện trống</div>
          )}
          {maps.map((map) => (
            <div
              key={map.id}
              className={`group flex h-10 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-semibold transition ${activeMapId === map.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
            >
              <button
                className="flex flex-1 items-center gap-3 overflow-hidden"
                onClick={() => setActiveMapId(map.id)}
              >
                <BrainCircuit className="size-4 shrink-0 text-primary" />
                <span className="truncate">{map.name}</span>
              </button>
              <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button title="Sửa tên" onClick={() => handleRenameMap(map.id, map.name)} className="p-1 hover:text-primary transition">
                  <Pencil className="size-3.5" />
                </button>
                <button title="Xóa" onClick={() => handleDeleteMap(map.id)} className="p-1 hover:text-destructive transition">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex gap-2 border-t border-outline p-4 shrink-0">
          <IconButton label="Cài đặt"><Settings2 className="size-4" /></IconButton>
          <p className="self-center text-xs leading-4 text-muted-foreground">Mọi thay đổi đã được lưu</p>
        </div>
      </aside>
      )}

      <section className={`h-[calc(100dvh-4rem)] transition-[margin] duration-200 ${sidebarOpen ? "lg:ml-60" : ""}`}>
        {isDesktop ? (
          <Group orientation="horizontal" className="h-full" id="workspace-panels">
            <Panel id="mind-map" defaultSize="66.667%" minSize="45%">
              {mindMapPanel}
            </Panel>
            <Separator className="resize-separator" aria-label="Điều chỉnh kích thước sơ đồ và ma trận">
              <GripVertical className="size-4" />
            </Separator>
            <Panel id="eisenhower" defaultSize="33.333%" minSize="28%" maxSize="55%">
              {matrixPanel}
            </Panel>
          </Group>
        ) : (
          <div className="grid grid-cols-1">
            {mindMapPanel}
            {matrixPanel}
          </div>
        )}
      </section>
    </main>
  );
}