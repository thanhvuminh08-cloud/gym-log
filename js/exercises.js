// Thư viện mặc định, seed khi DB trống. id cố định để giáo án/backup ổn định.
const L = [
  ['Ngực', ['Bench Press (đòn)', 'Incline Bench Press', 'Dumbbell Press', 'Incline Dumbbell Press', 'Chest Fly (cáp)', 'Dips', 'Hít đất']],
  ['Lưng', ['Deadlift', 'Pull-up', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'Seated Cable Row', 'T-Bar Row']],
  ['Vai', ['Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Rear Delt Fly', 'Face Pull']],
  ['Chân', ['Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Leg Extension', 'Leg Curl', 'Hip Thrust', 'Calf Raise']],
  ['Tay trước', ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Cable Curl']],
  ['Tay sau', ['Triceps Pushdown', 'Skull Crusher', 'Overhead Triceps Extension', 'Close-Grip Bench Press']],
  ['Bụng', ['Plank', 'Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel']],
];

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const MUSCLES = L.map(([m]) => m).concat('Khác');
export const DEFAULT_EXERCISES = L.flatMap(([muscle, names]) => names.map((name) => ({ id: 'x-' + slug(name), name, muscle })));
