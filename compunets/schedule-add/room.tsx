import { Room } from '@/app/api/schedule/type/schedule';

interface RoomTabProps {
  activeSheet: {
    rooms: Room[];
  };
  handleAddRoom: () => void;
  deleteRoom: (id: string) => void;
}

export default function RoomTab({
  activeSheet,
  handleAddRoom,
  deleteRoom
}: RoomTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-lg text-black">รายการห้องเรียน</h4>
        <button
          onClick={handleAddRoom}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + เพิ่มห้องเรียน
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {activeSheet.rooms.map((room: Room) => (
          <div key={room.id} className="border p-3 rounded flex justify-between items-center">
            <div>
              <div className="font-bold text-black">{room.name}</div>
              {room.capacity && (
                <div className="text-sm text-black">ความจุ: {room.capacity} คน</div>
              )}
            </div>

            <button
              onClick={() => {
                if (confirm('ลบห้องเรียนนี้?')) deleteRoom(room.id);
              }}
              className="text-black hover:text-gray-700"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
