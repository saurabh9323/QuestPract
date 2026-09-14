-- Disposable practice dataset. This creates only the quest90_practice schema.
-- It does not modify public.training_state or public.training_images.
-- Run in a practice database or your SQL editor, then SET search_path as below.
create schema if not exists quest90_practice;
set search_path = quest90_practice, public;
create table if not exists users(id integer primary key,name text not null,email text,region text,created_at timestamptz not null);
create table if not exists products(id integer primary key,name text not null,category text not null,price numeric(12,2) not null check(price>=0),stock integer not null check(stock>=0));
create table if not exists orders(id integer primary key,user_id integer not null references users(id),status text not null,total numeric(12,2) not null,created_at timestamptz not null);
create table if not exists order_items(order_id integer references orders(id),product_id integer references products(id),quantity integer not null check(quantity>0),unit_price numeric(12,2) not null,primary key(order_id,product_id));
create table if not exists payments(id integer primary key,order_id integer not null references orders(id),amount numeric(12,2) not null,status text not null,created_at timestamptz not null);
create table if not exists events(id integer primary key,user_id integer not null references users(id),event_type text not null,occurred_at timestamptz not null,payload jsonb not null default '{}');
create table if not exists departments(id integer primary key,name text not null);
create table if not exists employees(id integer primary key,name text not null,department_id integer references departments(id),manager_id integer references employees(id),salary numeric(12,2),hired_at date not null);
create table if not exists tasks(id integer primary key,user_id integer not null references users(id),title text not null,status text not null,due_date date,completed_at timestamptz);
insert into users select i,'Learner '||i,case when i%7=0 then null else 'learner_'||i||'@example.test' end,(array['IN','UK','US',null])[1+i%4],timestamptz '2026-08-01 09:00:00+00'+i*interval '1 day' from generate_series(1,30) i on conflict do nothing;
insert into products select i,'Data product '||i,(array['Books','Tools','Essentials','Courses'])[1+i%4],(i*23.5)::numeric,i%12 from generate_series(1,24) i on conflict do nothing;
insert into orders select i,1+i%25,(array['paid','shipped','pending','cancelled'])[1+i%4],(i*17.3)::numeric,timestamptz '2026-08-01 10:00:00+00'+i*interval '12 hours' from generate_series(1,120) i on conflict do nothing;
insert into order_items select o.id,1+(o.id+j)%20,1+j%3,p.price from orders o cross join generate_series(0,2) j join products p on p.id=1+(o.id+j)%20 on conflict do nothing;
insert into payments select i,1+i%100,(i*12.5)::numeric,case when i%4=0 then 'failed' else 'succeeded' end,timestamptz '2026-08-03 10:00:00+00'+i*interval '10 hours' from generate_series(1,160) i on conflict do nothing;
insert into events select i,1+i%28,(array['login','view','save','submit'])[1+i%4],timestamptz '2026-08-01 08:00:00+00'+i*interval '3 hours',jsonb_build_object('source',case when i%2=0 then 'web' else 'mobile' end,'campaign','fall','device',jsonb_build_object('type','desktop'),'tags',jsonb_build_array('learning','practice')) from generate_series(1,480) i on conflict do nothing;
insert into departments values(1,'Engineering'),(2,'Design'),(3,'Operations'),(4,'Research') on conflict do nothing;
insert into employees values(1,'Alex',1,null,150000,'2024-01-01'),(2,'Sam',1,1,120000,'2024-03-01'),(3,'Mira',1,1,120000,'2025-01-01'),(4,'Jo',2,null,110000,'2024-06-01'),(5,'Dev',2,4,125000,'2025-02-01'),(6,'Lee',3,null,100000,'2023-01-01'),(7,'Ari',3,6,null,'2026-01-01') on conflict do nothing;
insert into tasks select i,1+i%30,'Practice task '||i,case when i%3=0 then 'done' else 'pending' end,date '2026-09-01'+i%30,case when i%3=0 then timestamptz '2026-09-01 16:00:00+00'+(i%30+1)*interval '1 day' else null end from generate_series(1,90) i on conflict do nothing;
-- Deliberate learning cases: users with no orders, products with no sales,
-- an empty department, NULL salary/email/region, tied salaries, multiple payments,
-- and stored totals that need reconciliation. No query result is an auto-grade.
-- Some design exercises explicitly ask you to add a practice-only column/table.
