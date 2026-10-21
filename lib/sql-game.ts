import {sqlSeed} from './studio-content';
export const gameSeed=sqlSeed;
export const extraSeed=sqlSeed+`INSERT INTO employees VALUES (5,'Noor','Support',70000),(6,'Ira','Research',NULL);
INSERT INTO orders VALUES (5,5,150,'paid'),(6,1,10,'pending'),(7,5,20,'paid'),(8,4,0,'paid');`;
export type SqlMission={id:string;title:string;concept:string;goal:string;reference:string;hints:string[];ordered:boolean};
const mission=(id:string,title:string,concept:string,goal:string,reference:string,hints:string[],ordered=false):SqlMission=>({id,title,concept,goal,reference,hints,ordered});
export const sqlMissions:SqlMission[]=[
mission('roster','Open the station','SELECT','Return every employee name (one column).','SELECT name FROM employees',['Select just the requested column.','The table is employees; the column is name.']),
mission('salary','Unlock the salary gate','WHERE','Return name and salary for employees earning more than 50000.','SELECT name,salary FROM employees WHERE salary>50000',['Filter rows before returning them.','Use WHERE salary > 50000.']),
mission('departments','Collect unique badges','DISTINCT','Return each department once.','SELECT DISTINCT department FROM employees',['Repeated departments should collapse to one row.','SELECT DISTINCT removes duplicate result rows.']),
mission('unknown','Find the missing signal','NULL','Return names with unknown salary.','SELECT name FROM employees WHERE salary IS NULL',['NULL is not a number or an empty string.','Use IS NULL rather than = NULL.']),
mission('top','Climb the leaderboard','ORDER BY / LIMIT','Return name and salary for the two highest known salaries. Break ties by name ascending.','SELECT name,salary FROM employees WHERE salary IS NOT NULL ORDER BY salary DESC,name ASC LIMIT 2',['Remove unknown salaries, then sort and limit.','ORDER BY salary DESC, name ASC LIMIT 2'],true),
mission('paid','Connect the bridges','INNER JOIN','Return employee name and total for each paid order. Preserve duplicate rows.','SELECT e.name,o.total FROM employees e JOIN orders o ON e.id=o.employee_id WHERE o.status=\'paid\'',['Match employees.id with orders.employee_id.','Filter status to paid; do not group or use DISTINCT.']),
mission('totals','Power the stations','GROUP BY','Return employee_id and total paid amount for each employee who has paid orders.','SELECT employee_id,SUM(total) FROM orders WHERE status=\'paid\' GROUP BY employee_id',['Filter paid rows first, then group.','SUM(total) accumulates each employee’s paid orders.']),
mission('having','Pass the energy gate','HAVING','Return employee_id and total paid amount for groups whose paid total exceeds 100.','SELECT employee_id,SUM(total) FROM orders WHERE status=\'paid\' GROUP BY employee_id HAVING SUM(total)>100',['WHERE filters rows; HAVING filters groups.','Use HAVING SUM(total) > 100 after grouping.']),
mission('zero','Rescue every explorer','LEFT JOIN','Return employee name and number of orders, including zero orders, one row per employee.','SELECT e.name,COUNT(o.id) FROM employees e LEFT JOIN orders o ON e.id=o.employee_id GROUP BY e.id,e.name',['Keep employees even without an order.','COUNT(o.id), not COUNT(*), produces zero for unmatched employees.']),
mission('rank','Reach the summit','Window functions','Return name and dense salary rank for known salaries. Highest salary first; names ascending within ties.','SELECT name,DENSE_RANK() OVER (ORDER BY salary DESC) FROM employees WHERE salary IS NOT NULL ORDER BY salary DESC,name ASC',['Equal salaries share a dense rank.','DENSE_RANK() OVER (ORDER BY salary DESC); final ORDER BY also sorts names.'],true)
];
export function unlockedMission(passed:boolean[]){const first=passed.findIndex(x=>!x);return first===-1?passed.length-1:first}
