import { Subject, Teacher } from '@/app/api/schedule/type/schedule';

interface SubjectTabProps {
  activeSheet: {
    subjects: Subject[];
  };
  handleAddSubject: () => void;
  handleEditSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  teachers: Teacher[];
}

export default function SubjectTab({
  activeSheet,
  handleAddSubject,
  handleEditSubject,
  deleteSubject,
  teachers
}: SubjectTabProps) {
  // ฟังก์ชันสำหรับหา teacher name จาก id
  function getTeacherName(teacherId?: string): string {
    return teachers.find(t => t.id === teacherId)?.full_name || '';
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-lg text-black">รายการวิชา</h4>
        <button
          onClick={handleAddSubject}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + เพิ่มวิชา
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {activeSheet.subjects.map(subject => (
          <div
            key={subject.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-bold text-black">
                {subject.code} - {subject.name}
              </div>
              {subject.teacherId && (
                <div className="text-[14px] text-gray-500">{getTeacherName(subject.teacherId)}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditSubject(subject)}
                className="text-blue-600 hover:text-blue-700 font-medium"
                title="แก้ไข"
              >
                แก้ไข
              </button>
              <button
                onClick={() => deleteSubject(subject.id)}
                className="text-red-600 hover:text-red-700 font-medium"
                title="ลบ"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
      {activeSheet.subjects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          ยังไม่มีวิชา กรุณาเพิ่มวิชา
        </div>
      )}
    </div>
  );
}
