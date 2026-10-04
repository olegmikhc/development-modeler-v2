from pathlib import Path
import subprocess
bootstrap="""create role anon; create role authenticated; create schema auth; create schema extensions; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;"""
permissions='grant usage on schema public to anon,authenticated;grant select,insert,update,delete on all tables in schema public to anon,authenticated;'
sql=bootstrap+'\n'+'\n'.join(p.read_text() for p in sorted(Path('supabase/migrations').glob('*.sql')))+'\n'+permissions+'\n'+Path('tests/sql/viewer-invites.sql').read_text()
r=subprocess.run(['docker','exec','-i','modeler-invites-test','psql','-U','postgres','-v','ON_ERROR_STOP=1'],input=sql,text=True,capture_output=True)
print(r.stdout[-1500:]);print(r.stderr);raise SystemExit(r.returncode)
