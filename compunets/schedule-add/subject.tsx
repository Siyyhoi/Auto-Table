import { Subject } from '@/app/api/schedule/type/schedule';

interface SubjectTabProps {
  activeSheet: {
    subjects: Subject[];
  };
  handleAddSubject: () => void;
  deleteSubject: (id: string) => void;
}

export default function SubjectTab({
  activeSheet,
  handleAddSubject,
  deleteSubject
}: SubjectTabProps) {
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
            </div>

            <button
              onClick={() => {
                if (confirm('ลบวิชานี้?')) deleteSubject(subject.id);
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
