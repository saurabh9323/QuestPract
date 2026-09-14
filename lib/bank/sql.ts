import {pack} from './core';
function p(id:string,title:string,lesson:string,example:string,rows:string){pack('SQL',id,title,lesson,['Inspect schema + grain','Build a small query','Handle NULL + duplicates','Check plan + boundaries'],example,'Use the downloadable PostgreSQL practice schema, not your live training tables. Declare timestamp timezone and tie behavior; do not assume a join preserves row count.','https://www.postgresql.org/docs/current/tutorial.html',rows.trim().split('\n').map(s=>{const [q,a]=s.split('|');return `${q}|${q}|${a}`}).join('\n'))}
p('sql-select','SQL selection and expressions','A SELECT describes the desired result. WHERE keeps rows for which the predicate is true; SQL NULL introduces unknown rather than ordinary equality. ORDER BY is required for a guaranteed presentation order. Use explicit columns and stable tie breakers.','SELECT id,total FROM orders WHERE total >= 100 ORDER BY total DESC,id; returns a predictable two-column result.',`
List users created on or after September 1, 2026 in UTC.|Compare created_at against an explicit UTC timestamptz boundary.
Return products priced between 100 and 500 inclusive.|BETWEEN includes both boundaries; select id,name,price.
List orders whose status is paid or shipped.|Use IN with the two allowed status values.
Find users with no email address.|Use IS NULL; equality with NULL produces unknown and will not select these rows.
Find products whose name starts with Data, ignoring case.|PostgreSQL ILIKE 'Data%' matches the prefix case-insensitively.
Return the ten most expensive products with stable ties.|ORDER BY price DESC,id ASC LIMIT 10.
List the distinct product categories alphabetically.|DISTINCT removes duplicates; ORDER BY category defines presentation.
Display unknown for a user’s missing region.|COALESCE(region,'unknown') supplies a NULL fallback.
Classify orders as small below 100, medium below 500, or large.|CASE branches must be ordered and include a final ELSE.
Calculate each order item’s line total.|Multiply quantity by unit_price at the order-item grain.
Find tasks due before September 15, 2026 that are not done.|Filter due_date and status; decide explicitly whether NULL due dates count.
Return orders placed during September 2026 in UTC.|Use a half-open interval from September 1 inclusive to October 1 exclusive.
List users whose email contains a literal underscore.|Escape the underscore in LIKE rather than treating it as a wildcard.
Sort employees by salary descending with missing salaries last.|Use ORDER BY salary DESC NULLS LAST, id for ties.
Return products with stock equal to zero.|Use stock=0; distinguish unknown stock from zero if schema permits it.
Find orders with totals outside the inclusive range 50 through 1000.|Use total<50 OR total>1000 with clear parentheses if combined.
Return trimmed lowercase email values without modifying stored users.|Use lower(btrim(email)) as a projected expression.
Show the month containing each order’s creation timestamp.|Use date_trunc with an explicit reporting timezone.
Return a readable employee label combining name and id.|Use concat or explicit casts; understand NULL behavior of concatenation.
List pending tasks due today according to UTC.|Derive UTC calendar date explicitly rather than relying on session timezone.
`);
p('sql-joins','SQL joins and cardinality','A join combines matching rows; one-to-many relationships multiply output. Choose the result grain first, then aggregate at that grain. A left join preserves unmatched left rows only until later filters potentially remove them.','To include users with zero orders, LEFT JOIN orders and COUNT(orders.id), not COUNT(*), grouped by user identity.',`
List orders with their customer’s name.|Join orders.user_id to users.id at one row per order.
List every user with their number of orders, including zero.|LEFT JOIN and COUNT(order id), grouping by user.
Find users who have never ordered.|Use NOT EXISTS or a left join with a missing right-side key.
List products that have never appeared in order_items.|Use an anti-join keyed by product_id.
Show order items with product name and original purchased unit price.|Join products for name but retain order_items.unit_price for historical price.
Find users who ordered at least one Books-category product.|Use EXISTS across orders, order_items and products to avoid duplicate users.
List employees with their manager’s name, including top-level managers.|Self LEFT JOIN employees using manager_id.
List every department with employee count, including empty departments.|LEFT JOIN employees and count employee IDs.
Find orders with no successful payment.|NOT EXISTS a payment with matching order_id and status succeeded.
List orders whose customer and product category match a specified region and category.|Join the required relations and define whether output is one row per order or item.
Return one row per user with total ordered value and successful paid amount.|Preaggregate orders and payments separately before joining at user grain.
Find pairs of users sharing the same non-NULL region without mirrored pairs.|Self join on region and require first id<second id.
Find employees earning more than their manager.|Self join and compare salaries; NULL comparisons do not pass.
List products ordered by both user 1 and user 2.|Use grouped distinct user counts or intersect two product sets.
Find users who ordered in one category but never in another.|Combine EXISTS and NOT EXISTS with independent category predicates.
Find orders with two or more distinct product categories.|Join items/products and HAVING COUNT(DISTINCT category)>=2.
List all user/task combinations only for tasks belonging to that user.|Join on tasks.user_id rather than a Cartesian product.
Return product pairs purchased together, each pair once per order.|Self join order_items on order_id with lower product_id first.
Explain and repair a revenue query inflated by joining order_items.|Aggregate line revenue or order totals at the intended grain before combining.
Keep users with no shipped orders while counting only their shipped orders.|Put shipped status in the join condition, not a WHERE that removes unmatched users.
`);
p('sql-aggregate','SQL aggregation','Grouping collapses input rows into groups. COUNT, SUM and AVG differ in NULL handling and empty-set behavior. Distinct counts should reflect entity identity, not hide an incorrect join. Filter rows before aggregation and groups after.','A department average ignores NULL salaries; a department with no salary values has a NULL average rather than zero.',`
Count all registered users.|COUNT(*) counts rows at the user table grain.
Count users who supplied an email.|COUNT(email) excludes NULL values.
Calculate total paid-order revenue by region.|Join paid orders to users, then group by region.
Find categories with more than ten products.|GROUP BY category with HAVING COUNT(*)>10.
Calculate average order total per user for users with at least three orders.|Group by user_id and use HAVING on order count.
Return minimum and maximum salary per department.|Group employees by department_id; decide how to display NULL aggregates.
Count orders in each status in a single output row.|Use conditional aggregation or FILTER for each status.
Calculate revenue by UTC calendar month.|Group by date_trunc('month', created_at AT TIME ZONE 'UTC').
Find the five users with highest total order value.|Aggregate by user, then order by sum descending with stable ties.
Count distinct purchasing users per product.|Join items to orders and count DISTINCT orders.user_id.
Find orders with line-item sum different from stored total.|Aggregate quantity*unit_price by order and compare with total.
Calculate weighted average selling price per product.|Divide sum(quantity*unit_price) by sum(quantity), guarding zero denominators.
Count overdue open tasks for each user as of September 15.|Filter/aggregate status and due_date using the specified date.
Find departments whose average salary exceeds the company average.|Compare grouped AVG against an independent overall AVG.
Calculate paid-order share as a decimal percentage.|Divide filtered paid count by total count with numeric casting and zero guard.
List categories with no units sold, including their zero totals.|LEFT JOIN items and COALESCE the grouped quantity sum.
Compute each user’s first and last order timestamp.|Use MIN and MAX per user, retaining users without orders if required.
Return category subtotals and a grand total.|Use GROUPING SETS or ROLLUP and identify subtotal rows explicitly.
Count daily active users from events.|Group by UTC date and COUNT(DISTINCT user_id).
Find users with more than one distinct successful payment on an order.|Group by order/user and count successful payment IDs, not joined item rows.
`);
p('sql-subqueries','Subqueries and CTEs','A subquery expresses a dependent or independent intermediate result. EXISTS asks whether any row qualifies and avoids unnecessary result multiplication. CTEs name stages for clarity; do not assume they always improve performance or always materialize.','NOT EXISTS is often clearer than NOT IN when the compared set could contain NULL, because NULL can make NOT IN unknown.',`
Find products priced above their category average.|Use a correlated average or a grouped category CTE joined back.
Find users with an order larger than their own average order.|Correlate the average by user, then return distinct users or use EXISTS.
Find the second-highest distinct employee salary.|Select distinct salaries and rank or offset, defining no-second-value behavior.
Return users with no tasks using NOT EXISTS.|Correlate tasks.user_id to the current user ID.
Find products more expensive than every Books product.|Use > ALL with explicit empty-set and NULL assumptions.
Find users whose every order is paid, excluding users with no orders.|Require at least one order and no order with a disallowed status.
Find users who bought every product in category Essentials.|Use relational division with nested NOT EXISTS, defining an empty category policy.
Build a CTE for successful payment sums and compare it to order totals.|Aggregate payments first, then left join orders and handle missing payments.
Find orders above the global median total.|Compute a percentile aggregate in a subquery and compare outer rows.
Find employees in the department with the highest average salary.|Rank department aggregates and state how ties are handled.
List users whose latest order is cancelled.|Find the latest by created_at and id, then inspect its status.
Find categories whose revenue rose from August to September 2026.|Aggregate each month at category grain and compare aligned results.
Return users appearing in both order and event activity sets.|Use INTERSECT or two EXISTS predicates.
Return user IDs active in events but absent from orders.|Use EXCEPT or NOT EXISTS without NULL-sensitive NOT IN behavior.
Show why NOT IN can return no rows when its subquery contains NULL.|Construct a tiny VALUES example and explain three-valued logic.
Split a complex revenue query into three named CTE stages.|Separate source filtering, correct-grain aggregation and final presentation.
Find orders whose every item has quantity at least two.|Require item existence and reject any quantity below two.
Find users whose order total exceeds their region’s average user spending.|Aggregate spending per user, then compute regional averages over those aggregates.
Select the latest successful payment for every order with deterministic ties.|Use a lateral subquery ordered by timestamp/id with LIMIT 1 or a window rank.
Find employees who manage nobody.|Use an anti-existence self-query on manager_id.
`);
p('sql-windows','Window functions','Window functions compute across a related row set while preserving each row. PARTITION BY defines independent groups; ORDER BY and the frame define the calculation’s scope. Default frames can surprise cumulative calculations when ordering values tie.','SUM(total) OVER(PARTITION BY user_id ORDER BY created_at,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) gives an explicit running total.',`
Rank employees by salary within each department, preserving ties and gaps.|Use RANK over department partitions with descending salary.
Rank salaries without gaps after ties.|Use DENSE_RANK and exclude or explicitly order NULL salary values.
Return exactly three highest-paid employees per department with stable ties.|Use ROW_NUMBER ordered by salary DESC,id and filter row number≤3.
Return all employees in the top three distinct salary levels per department.|Use DENSE_RANK rather than ROW_NUMBER.
Calculate a running order total for each user.|Order by created_at,id with an explicit ROWS frame.
Show each order’s previous order total for the same user.|Use LAG(total) over a deterministic per-user order.
Calculate days between consecutive user orders.|Subtract timestamps obtained using LAG and define first-row output.
Show the next event type for each user’s event.|Use LEAD over occurred_at,id.
Calculate each product’s share of category revenue.|Aggregate product revenue first, then divide by a partitioned sum.
Compare each salary with its department average without collapsing rows.|Use AVG(salary) OVER(PARTITION BY department_id).
Return first and latest order total alongside each user order.|Use FIRST_VALUE and LAST_VALUE with an explicit full-partition frame for last.
Explain LAST_VALUE’s surprising default-frame result.|A default ordered frame may end at the current peer group rather than the partition end.
Calculate a three-order moving average per user.|Use ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.
Calculate a seven-day revenue moving sum over a daily calendar.|Create/fill calendar days first, then use an explicit six-prior-row frame.
Assign employees to four salary buckets.|Use NTILE(4) and clarify that equal salaries can cross buckets.
Calculate salary percentile position within each department.|Compare PERCENT_RANK and CUME_DIST tie and denominator semantics.
Deduplicate events retaining earliest identical user/type/timestamp row.|Partition by duplicate key and use ROW_NUMBER ordered by id.
Find users with three consecutively paid orders.|Use lagged statuses or a run identifier over deterministic order.
Identify each user’s largest jump in order value.|Compute current minus LAG total, then rank changes per user.
Return the most recent event per user using DISTINCT ON and a window alternative.|Both approaches need deterministic timestamp/id ordering.
`);
p('sql-time','Time-series SQL','Reporting timestamps require an explicit timezone and interval convention. Missing calendar dates are missing rows, not implicit zeroes. Cohorts, retention and sessions need precise event definitions and denominators.','Generate a UTC date series, left join daily aggregates, and COALESCE missing counts to zero before computing a moving average.',`
Generate every date in September 2026.|Use generate_series with date boundaries and one-day intervals.
Show daily order counts including days with no orders.|Left join a calendar to preaggregated UTC order dates.
Calculate month-over-month paid revenue growth.|Aggregate monthly revenue, use LAG, and guard a zero prior month.
Compute signup cohorts by UTC month.|Truncate users.created_at at UTC month and group user IDs.
Measure day-one event retention after signup.|Define active event presence on signup UTC date+1 and divide by cohort size.
Measure seven-day retention as any event on day seven.|Use the exact seventh-day interval rather than any event during the first week.
Count weekly active users with Monday week boundaries.|Use the defined timezone with date_trunc('week') and distinct users.
Find users active on five consecutive UTC dates.|Deduplicate user/date and identify gaps-and-islands groups.
Calculate the longest daily activity streak per user.|Group consecutive distinct dates and count each island.
Sessionize events using a gap greater than 30 minutes.|Flag first events or gaps>30m with LAG, then cumulative-sum session starts.
Calculate session duration for each user/session.|After session IDs, subtract MIN occurred_at from MAX occurred_at.
Find events outside business hours 09:00–17:00 Asia/Kolkata.|Convert timezone before comparing local time, defining the end as exclusive.
List tasks completed after their due calendar date.|Compare completion in the chosen timezone to due_date, not naive timestamp equality.
Compute average days from signup to first order.|Find first order per user then subtract signup, deciding whether to exclude nonbuyers.
Find users with no events in the 30 days before October 1.|Use NOT EXISTS over a half-open September activity window.
Calculate cumulative users registered by each day.|Aggregate signups into calendar dates and use a running sum.
Compare this month’s revenue through day 15 with the prior month’s first 15 days.|Align partial periods and use explicit exclusive upper boundaries.
Find the busiest UTC hour of day across all events.|Extract hour after UTC conversion and aggregate across dates.
Calculate median time between successful payments for each order.|Use LAG on successful payments then percentile_cont on the intervals or seconds.
Explain how daylight-saving transitions affect a local-day report.|Local days may span 23 or 25 hours; use timezone-aware boundaries rather than fixed 24-hour assumptions.
`);
p('sql-writes','SQL writes and constraints','Writes should preserve invariants under concurrency. Prefer constraints for shared facts, parameterized values for safety, and transactions for related changes. Practice destructive statements only against the supplied disposable schema and inspect affected rows.','UPDATE products SET stock=stock-2 WHERE id=1 AND stock>=2 RETURNING stock atomically reserves only when enough stock remains.',`
Insert a user with a supplied unused ID and return that ID.|The fixture uses explicit integer IDs. Use INSERT with named columns and RETURNING id.
Update a user’s region by ID and return the changed row.|Use a precise WHERE predicate and RETURNING, checking zero-row outcomes.
Increase all Books product prices by 5 percent in the practice schema.|Use a category predicate and exact numeric arithmetic; preview with SELECT first.
Reserve three units only if product stock is sufficient.|Use a conditional atomic UPDATE rather than a read-then-write check.
Insert multiple order items in one statement.|Provide a VALUES list and rely on foreign/quantity constraints.
Create an order and its items atomically.|Wrap related inserts in a transaction and use the returned order ID.
Add a unique case-insensitive email rule in the practice schema.|Use a normalized expression unique index and define handling of NULL/blank values.
Add a constraint requiring nonnegative product stock.|Use CHECK(stock>=0) with a NOT NULL decision and validate existing rows.
Prevent duplicate product entries within an order.|Use a composite primary/unique key on order_id,product_id.
Upsert a product by ID while updating price and stock.|Use ON CONFLICT(id) DO UPDATE with explicit allowed fields.
Insert an event only once for a supplied external event ID.|Define a durable unique idempotency key before using ON CONFLICT.
Mark overdue pending tasks as overdue in the practice schema.|Use a bounded due_date predicate and a permitted status transition.
Delete practice tasks completed before January 1, 2026.|Preview exact rows, use a transaction, and verify RETURNING before commit.
Explain ON DELETE CASCADE versus RESTRICT for order items.|Cascade removes dependent rows; restrict prevents parent deletion while references exist.
Copy selected users into a reporting table with INSERT SELECT.|Specify target columns and deliberate conflict/duplicate handling.
Update order totals from aggregated line items.|Use UPDATE FROM a one-row-per-order aggregate to avoid ambiguous multiple matches.
Repair NULL regions to unknown without touching known regions.|Use WHERE region IS NULL; an empty string is a separate case.
Use a savepoint to recover one failed step in a larger transaction.|ROLLBACK TO SAVEPOINT restores that boundary while keeping the surrounding transaction open.
Return IDs of rows changed by a bulk status update.|Use RETURNING id and check expected cardinality.
Design a safe soft-delete column for users.|Add deleted_at, define filtered reads/uniqueness rules, and avoid assuming every query remembers the filter.
`);
p('sql-transactions','Transactions and concurrency','Atomicity groups changes; isolation defines what concurrent transactions see. Locks and constraints coordinate conflicts. A correct design names the invariant and tests two interleaved sessions. Deadlock recovery must retry a safe unit of work, not a random final statement.','Two sessions decrementing stock via conditional arithmetic UPDATE serialize around the row and recheck the predicate instead of both trusting a stale read.',`
Demonstrate a lost update with two sessions editing the same stock value.|Read the same old value, derive replacements, then show one writer overwriting the other’s intent.
Prevent that lost update using an arithmetic UPDATE.|Compute stock=stock-delta in the database with a sufficient-stock condition.
Use SELECT FOR UPDATE before a multi-step stock adjustment.|Keep the lock and dependent write in one short transaction.
Implement optimistic concurrency with a version column.|UPDATE WHERE id=? AND version=? and increment version; zero rows means conflict.
Explain what a read-committed transaction can see across two SELECTs.|Each statement can observe a newer committed snapshot under PostgreSQL read committed.
Compare repeatable-read behavior with read committed.|Repeatable read holds a transaction snapshot but can still require retries for conflicting updates.
Explain a write-skew example and a possible remedy.|Two transactions validate a shared invariant then change different rows; consider serializable isolation or explicit coordination.
Create a deadlock using opposite row-lock order in two practice sessions.|Each session locks one row then requests the other; consistent lock order avoids the cycle.
Design retry behavior after a serialization failure.|Retry the full transaction with bounded backoff and safe external-side-effect handling.
Claim pending tasks with FOR UPDATE SKIP LOCKED.|Select eligible rows and mark ownership within one transaction; do not treat it as a universal queue guarantee.
Show the effect of NOWAIT on a locked row.|The request fails immediately instead of waiting, allowing an explicit application response.
Make transfer of stock between two product records atomic.|Lock in deterministic order, validate source quantity, update both, and commit together.
Explain why an email uniqueness precheck is race-prone.|Concurrent inserts can both see absence; enforce uniqueness in the database and handle the violation.
Design an idempotent payment-record insertion.|Scope a unique operation key and persist outcome alongside the intended state change.
Explain why calling an external API inside a long transaction is risky.|It extends lock/connection lifetimes and cannot automatically roll back external effects.
Design an outbox table for order-created events.|Commit domain change and outbox event together; publish asynchronously with duplicate-safe consumers.
Explain statement timeout versus lock timeout.|One bounds statement duration; the other bounds waiting to acquire locks under configured behavior.
Inspect blocked sessions and their blockers.|Use pg_stat_activity and pg_blocking_pids with appropriate privileges in a safe environment.
Explain how long-running transactions affect cleanup.|Old snapshots can prevent removal of dead tuples and contribute to bloat.
Test concurrent upserts of the same unique key.|Run two sessions and verify one invariant-preserving final row with a defined update policy.
`);
p('sql-performance','SQL indexing and plans','Performance depends on data distribution, row counts, access patterns and the actual plan. An index is not automatically used or beneficial. Measure representative data, distinguish estimated from actual rows, and preserve correctness while changing query shape.','A filter on user_id ordered by created_at,id may benefit from a matching composite index; a broad full-table aggregate may correctly prefer a sequential scan.',`
Propose an index for user orders sorted newest first.|Consider (user_id,created_at DESC,id DESC) matching equality and stable order.
Propose a partial index for pending tasks with due dates.|Index the frequent predicate’s relevant subset and confirm query predicate compatibility.
Compare a sequential scan and index scan on a small table.|A sequential scan can be cheaper; inspect cost and actual data size rather than forcing an index.
Investigate an estimated-versus-actual row-count mismatch.|Check statistics, skew, correlated columns and outdated ANALYZE information.
Explain why applying a function to an indexed column can hurt a filter.|The plain index may not match the expression; rewrite a range or consider an expression index.
Rewrite a date(created_at)=date filter into a timestamp range.|Use inclusive lower and exclusive next-day upper bounds in the reporting timezone.
Compare large OFFSET pagination with keyset pagination.|Use stable sort keys and a boundary predicate rather than scanning/discarding many prior rows.
Design a covering index for a frequent read query.|Include needed nonkey columns only when benefit justifies size/write cost.
Explain composite-index left-prefix behavior for your proposed query.|Match equality/range/order usage to the actual index and plan, not a blanket rule.
Measure a query before and after adding an index.|Use representative data and EXPLAIN ANALYZE on safe SELECT statements.
Identify a sort spilling to disk in a query plan.|Inspect sort method and memory/disk evidence before tuning work_mem or reducing rows.
Compare nested-loop, hash and merge joins conceptually.|Relate each to input sizes, ordering, index support and memory rather than declaring one always fastest.
Diagnose an N+1 query pattern from application logs.|Count queries per request and batch or join needed records without multiplying the output incorrectly.
Explain why SELECT star can be expensive.|It fetches/transmits unnecessary fields and can prevent narrower access plans.
Compare UNION and UNION ALL cost and semantics.|UNION deduplicates; UNION ALL retains duplicates and avoids that work.
Design a monthly partition strategy for a large events table.|Choose the partition key and retention/query pattern, then verify partition pruning.
Explain when a materialized view could help a dashboard.|Precompute expensive aggregates with an explicit refresh and freshness policy.
Design indexes for a foreign-key-heavy delete/update workload.|Referencing-column indexes can reduce lookup work; verify actual operations and tradeoffs.
Investigate increasing table bloat after many updates.|Inspect dead tuples, autovacuum and long transactions; do not jump straight to disruptive maintenance.
Explain why increasing every memory setting is not a safe optimization.|Per-operation/session allocations multiply under concurrency and can exhaust system memory.
`);
p('sql-advanced','Advanced PostgreSQL','PostgreSQL supports recursive queries, JSONB, arrays and row-level security. These features solve specific data shapes but should not replace a clear relational model. Security policies must cover both rows visible before an update and rows permitted after it.','A recursive employee hierarchy starts from a manager and repeatedly joins employees.manager_id to the prior level, while preventing cycles in imperfect data.',`
List all descendants of employee 1 with their depth.|Use WITH RECURSIVE and a visited path or cycle protection.
Build each employee’s management path from the root.|Seed top-level managers and append child IDs/names during recursion.
Detect a cycle in an employee-manager hierarchy.|Track visited IDs on each recursive path and flag repeated membership.
Generate a hierarchical department report using recursive traversal.|First define the added parent_department_id contract and handle orphan/cycle cases.
Extract a source string from events.payload JSONB.|Use payload->>'source'; missing keys produce NULL.
Find events whose payload contains a specified campaign key/value.|Use JSONB containment with a correctly typed JSON value.
Count events by a nested payload device type.|Extract the nested text path and decide how to group missing values.
Expand a JSONB array of tags into rows.|Use jsonb_array_elements_text with a lateral join, validating array shape.
Aggregate ordered product names into one array per order.|Use array_agg with an ORDER BY inside the aggregate.
Aggregate order items into JSON per order.|Use jsonb_agg/jsonb_build_object and handle empty orders deliberately.
Explain JSONB containment versus text comparison.|Containment compares JSON structure/types; text extraction changes the comparison domain.
Find users with duplicate normalized emails.|Group lower(btrim(email)), excluding NULL and defining blank-email policy.
Return a median and 90th percentile order total.|Use percentile_cont or percentile_disc with a stated interpolation choice.
Compute each department’s salary distribution including quartiles.|Use ordered-set aggregates and consistent NULL treatment.
Create a view exposing only nonsensitive user columns.|A view limits projected data, but permissions and security behavior still need explicit configuration.
Write an RLS SELECT policy for user-owned training records.|Use authenticated identity equal to user_id and ensure RLS is enabled.
Write INSERT and UPDATE ownership checks for those records.|WITH CHECK restricts the resulting owner; USING restricts existing rows for updates.
Explain why SECURITY DEFINER functions need care.|They execute with owner privileges; constrain search_path, permissions, inputs and intended authority.
Design a revision-checked JSONB progress save function.|Atomically compare expected revision, replace payload, increment revision and return conflict on no match.
Test a complete migration without touching live training data.|Use the isolated practice schema, a transaction where supported, and checks for constraints, policies and rollback behavior.
`);
