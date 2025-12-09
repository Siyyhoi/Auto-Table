import { Teacher, Room } from '@/app/api/schedule/type/schedule';

interface TeacherTabProps {
  activeSheet: {
    teachers: Teacher[];
    rooms: Room[];
  };
  handleAddTeacher: () => void;
  handleEditTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  handleTeacherRoomToggle: (teacherId: string, roomId: string) => void;
}

export default function TeacherTab({
  activeSheet,
  handleAddTeacher,
  handleEditTeacher,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {activeSheet.teachers.map(teacher => (
          <div key={teacher.id} className="border p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-black">{teacher.full_name}</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTeacher(teacher)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  title="แก้ไข"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => deleteTeacher(teacher.id)}
                  className="text-red-600 hover:text-red-700 font-medium"
                  title="ลบ"
                >
                  ลบ
                </button>
              </div>
            </div>

            {/* <div className="mt-2">
              <div className="text-sm font-medium mb-2 text-black">ห้องที่สอนได้:</div>

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
            </div> */}
          </div>
        ))}
      </div>
      {activeSheet.teachers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          ยังไม่มีอาจารย์ กรุณาเพิ่มอาจารย์
        </div>
      )}
    </div>
  );
}
