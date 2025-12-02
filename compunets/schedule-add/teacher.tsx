import { Teacher, Room } from '@/app/api/schedule/type/schedule';

interface TeacherTabProps {
  activeSheet: {
    teachers: Teacher[];
    rooms: Room[];
  };
  handleAddTeacher: () => void;
  deleteTeacher: (id: string) => void;
  handleTeacherRoomToggle: (teacherId: string, roomId: string) => void;
}

export default function TeacherTab({
  activeSheet,
  handleAddTeacher,
  deleteTeacher,
  handleTeacherRoomToggle
}: TeacherTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-lg text-black">รายการอาจารย์</h4>
        <button
          onClick={handleAddTeacher}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + เพิ่มอาจารย์
        </button>
      </div>

      <div className="space-y-4">
        {activeSheet.teachers.map(teacher => (
          <div key={teacher.id} className="border p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-black">{teacher.name}</div>

              <button
                onClick={() => {
                  if (confirm('ลบอาจารย์นี้?')) deleteTeacher(teacher.id);
                }}
                className="text-black hover:text-gray-700"
              >
                ลบ
              </button>
            </div>

            <div className="mt-2">
              <div className="text-sm font-medium mb-2">ห้องที่สอนได้:</div>

              <div className="flex flex-wrap gap-2">
                {activeSheet.rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleTeacherRoomToggle(teacher.id, room.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      teacher.availableRooms.includes(room.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
