import { motion } from "framer-motion";
import {
  ClassSlot,
  Subject,
  Teacher,
  Room,
} from "@/app/api/schedule/type/schedule";

interface ScheduleTableProps {
  PERIODS: any[];
  DAYS: any[];
  activeSheet: any;
  openHeaderEdit: (type: string, id: number) => void;
  openEdit?: (dayKey: string, periodId: number) => void;
  containerVar: any;
  itemVar: any;
}

export default function ScheduleTable({
  PERIODS,
  DAYS,
  activeSheet,
  openHeaderEdit,
  openEdit,
  containerVar,
  itemVar
}: ScheduleTableProps) {
  // สร้าง grid template columns แบบ dynamic ตามจำนวนคาบ
  const gridCols = `100px repeat(${PERIODS.length}, minmax(120px, 1fr))`;

  return (
    <motion.div 
      variants={containerVar}
      initial="hidden"
      animate="visible"
      className="bg-white p-4 rounded-xl shadow-lg overflow-x-auto"
    >
      <div style={{ minWidth: `${800 + (PERIODS.length - 8) * 120}px` }}>

        {/* Header Row */}
        <div 
          className="grid gap-1 mb-2"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="bg-gray-200 p-2 rounded-lg text-center font-bold text-black flex items-center justify-center">
            วัน / เวลา
          </div>

          {PERIODS.map((p) => (
            <motion.div 
              key={p.id} 
              whileHover={{ y: -2 }}
              onClick={() => openHeaderEdit("period", p.id)}
              className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <div className="font-bold text-black">คาบ {p.id}</div>
              <div className="text-xs text-black">{p.time}</div>
            </motion.div>
          ))}
        </div>

        {/* Rows */}
        {DAYS.map((day) => (
          <motion.div 
            key={day.key} 
            variants={itemVar}
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className={`${day.color} p-2 rounded-lg flex items-center justify-center font-bold shadow-sm`}>
              <span className="text-black">{day.label}</span>
            </div>

            {PERIODS.map((period) => {
            const slotData = activeSheet.slots.find(
              (s: ClassSlot) => s.day === day.key && s.period === period.id
            );

            const subject = slotData
              ? activeSheet.subjects.find(
                  (s: Subject) => s.code === slotData.subjectCode
                )
              : null;

            const teacher = slotData?.teacherId
              ? activeSheet.teachers.find(
                  (t: Teacher) => t.id === slotData.teacherId
                )
              : null;

            const room = slotData?.roomId
              ? activeSheet.rooms.find(
                  (r: Room) => r.id === slotData.roomId
                )
              : null;

              return (
                <motion.div
                  key={period.id}
                  onClick={() => openEdit(day.key, period.id)} // (ถ้ายังมี onClick อยู่)
                  whileHover={{ scale: 1.02, zIndex: 10, boxShadow: "0px 5px 15px rgba(0,0,0,0.1)" }}
                  className={`
                    relative min-h-[80px] rounded-lg border cursor-pointer transition-colors
                    flex flex-col items-center justify-center text-center p-1
                    ${slotData ? 'bg-white border-blue-400' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}
                  `}
                >
                  {/* ✅ เปลี่ยนมาใช้ && แทน ? : */}
                  {slotData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                      <div className="font-bold text-sm text-black">{slotData.subjectCode}</div>
                      <div className="text-xs text-black line-clamp-2">{slotData.subjectName}</div>
                      {/* ถ้าตัวแปร teacher มีค่า ก็แสดง */}
                      {teacher && <div className="text-[10px] text-black mt-1">{teacher.name}</div>}
                      {/* ถ้าตัวแปร room มีค่า ก็แสดง */}
                      {room && <div className="text-[10px] bg-gray-200 px-1 rounded mt-1 inline-block">{room.name}</div>}
                    </motion.div>
                  )}
                  
                </motion.div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
