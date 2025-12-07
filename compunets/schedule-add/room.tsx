import { Room } from '@/app/api/schedule/type/schedule';

interface RoomTabProps {
  activeSheet: {
    rooms: Room[];
  };
  handleAddRoom: (room: Room) => void;
  handleEditRoom: (room: Room) => void;
  deleteRoom: (id: string) => void;
  getSheetByRoomId?: (roomId: string) => any;
  onOpenAddRoomModal?: () => void;
}

export default function RoomTab({
  activeSheet,
  handleAddRoom,
  handleEditRoom,
  deleteRoom,
  getSheetByRoomId,
  onOpenAddRoomModal
}: RoomTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-lg text-black">รายการห้องเรียน</h4>
        <button
          onClick={() => onOpenAddRoomModal && onOpenAddRoomModal()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + เพิ่มห้องเรียน
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {activeSheet.rooms.map((room: Room) => {
          const hasSchedule = getSheetByRoomId && getSheetByRoomId(room.id);
          return (
            <div key={room.id} className="border p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-bold text-black flex items-center gap-2">
                  {room.name}
                  {hasSchedule && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      📅 มีตารางเรียน
                    </span>
                  )}
                </div>
                {room.capacity && (
                  <div className="text-sm text-black">ความจุ: {room.capacity} คน</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditRoom(room)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  title="แก้ไข"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => deleteRoom(room.id)}
                  className="text-red-600 hover:text-red-700 font-medium"
                  title="ลบ"
                >
                  ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {activeSheet.rooms.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          ยังไม่มีห้องเรียน กรุณาเพิ่มห้องเรียนเพื่อสร้างตารางเรียน
        </div>
      )}
    </div>
  );
}
