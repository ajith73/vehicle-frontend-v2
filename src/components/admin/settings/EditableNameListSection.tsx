import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';

type EditableNameListSectionProps = {
  title: string;
  placeholder: string;
  emptyLabel: string;
  items: Array<{ id: number; name: string }>;
  newValue: string;
  editingId: number | null;
  editingName: string;
  onNewValueChange: (value: string) => void;
  onEditingNameChange: (value: string) => void;
  onAdd: (event: React.FormEvent) => void;
  onEditStart: (item: { id: number; name: string }) => void;
  onEditCancel: () => void;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
};

export function EditableNameListSection({
  title,
  placeholder,
  emptyLabel,
  items,
  newValue,
  editingId,
  editingName,
  onNewValueChange,
  onEditingNameChange,
  onAdd,
  onEditStart,
  onEditCancel,
  onUpdate,
  onDelete
}: EditableNameListSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <form onSubmit={onAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder={placeholder}
          value={newValue}
          onChange={(event) => onNewValueChange(event.target.value)}
          className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={!newValue.trim()}
          className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="bg-background border border-border rounded-lg max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
            {editingId === item.id ? (
              <div className="flex flex-1 items-center gap-2 mr-4">
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => onEditingNameChange(event.target.value)}
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  onKeyDown={(event) => event.key === 'Enter' && onUpdate(item.id)}
                />
                <button onClick={() => onUpdate(item.id)} className="text-green-600 hover:bg-green-100 p-1 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                <button onClick={onEditCancel} className="text-muted-foreground hover:bg-secondary p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <span className="font-medium text-sm flex-1">{item.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEditStart(item)}
                    className="text-primary/80 hover:text-primary p-1 rounded-md hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-destructive/80 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">{emptyLabel}</div>
        )}
      </div>
    </div>
  );
}
