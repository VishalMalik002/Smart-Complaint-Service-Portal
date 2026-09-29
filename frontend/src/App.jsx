import React,{useEffect,useMemo,useState} from 'react';
import api from './services/api';

const STATUSES=['SUBMITTED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REOPENED','REJECTED'];
const PRIORITIES=['LOW','MEDIUM','HIGH','CRITICAL'];
const FALLBACK_CATEGORIES=['Water Supply','Electricity','Road & Infrastructure','Sanitation','Garbage Collection','Public Transport','Street Lighting','Other'];
const statusLabel=s=>String(s||'').replaceAll('_',' ');
const progress={SUBMITTED:20,ASSIGNED:40,IN_PROGRESS:65,RESOLVED:88,CLOSED:100,REOPENED:45,REJECTED:100};

export default function App(){
 const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('smartserve_user')||'null'));
 const [theme,setTheme]=useState(()=>localStorage.getItem('smartserve_theme')||'dark');
 useEffect(()=>{document.body.className=theme;localStorage.setItem('smartserve_theme',theme)},[theme]);
 if(!user)return <Auth onLogin={setUser}/>;
 return <Workspace user={user} theme={theme} setTheme={setTheme} logout={()=>{localStorage.clear();setUser(null)}}/>;
}

function Workspace({user,theme,setTheme,logout}){

const role=user.role;

const pageKey = `smartserve_page_${user.id || user.email || role}`;

const [page,setPage]=useState(
  () => localStorage.getItem(pageKey) || 'Dashboard'
);

const go = (nextPage) => {
  setPage(nextPage);
  localStorage.setItem(pageKey, nextPage);
};


 const nav=role==='ADMIN'?['Dashboard','All Complaints','Users','Staff','Categories','Analytics','Profile']:role==='STAFF'?['Dashboard','Assigned Complaints','Profile']:['Dashboard','New Complaint','My Complaints','Services','Profile'];
 return <div className="app"><header className="top"><div className="brand"><div className="logo">S</div><div><b>SmartServe</b><small>Complaint & Service Portal</small></div></div><div className="user"><span className="role-pill">{role}</span><button className="theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'☀':'☾'}</button><span>{user.name}</span><div className="avatar">{user.name.slice(0,2).toUpperCase()}</div><button className="logout" onClick={logout}>Logout</button></div></header><div className="shell"><aside><nav>{nav.map(x=><button key={x} className={page===x?'active':''} onClick={()=>go(x)}>{icon(x)} &nbsp; {x}</button>)}
 
 </nav></aside><main>
  
  {role==='ADMIN'
    ? <Admin page={page} go={setPage} user={user}/>
    : role==='STAFF'
      ? <Staff page={page} user={user}/>
      : <Customer page={page} user={user}/>
  }</main></div></div>
}

const icon=x=>({Dashboard:'▦','All Complaints':'◷',Users:'♙',Staff:'◉',Categories:'▤',Analytics:'◒','Assigned Complaints':'✓','New Complaint':'＋','My Complaints':'◷',Services:'▤',Profile:'⚙'}[x]||'•');

function Admin({page,go,user}){
 const [dash,setDash]=useState({totalComplaints:0,submitted:0,assigned:0,inProgress:0,resolved:0,closed:0,reopened:0,users:0,staff:0});
 const [complaints,setComplaints]=useState([]),[staff,setStaff]=useState([]),[users,setUsers]=useState([]),[categories,setCategories]=useState([]),[loading,setLoading]=useState(true),[selected,setSelected]=useState(null);
 const load=async()=>{setLoading(true);try{const [d,c,s,u,cat]=await Promise.all([api.get('/admin/dashboard'),api.get('/admin/complaints'),api.get('/admin/staff'),api.get('/admin/users'),api.get('/admin/categories')]);setDash(d.data);setComplaints(c.data);setStaff(s.data);setUsers(u.data);setCategories(cat.data)}catch(e){console.error(e)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);

if(page==='All Complaints')return <>
  <AdminComplaints
    complaints={complaints}
    staff={staff}
    reload={load}
    loading={loading}
    open={setSelected}
  />
  {selected&&
    <ComplaintDetail
      id={selected}
      close={()=>setSelected(null)}
      refresh={load}
      role="ADMIN"
    />
  }
</>;


 if(page==='Users')return <UserManagement users={users} reload={load}/>;
 if(page==='Staff')return <StaffManagement staff={staff} complaints={complaints}/>;
 if(page==='Categories')return <CategoryManagement categories={categories} reload={load}/>;
 if(page==='Analytics')return <Analytics dash={dash}/>;
 if(page==='Profile')return <Profile user={user}/>;
 return <AdminDashboard dash={dash} complaints={complaints} go={go} open={setSelected} loading={loading}/>;
}
function AdminDashboard({dash,complaints,go,open,loading}){const resolution=dash.totalComplaints?Math.round((dash.resolved+dash.closed)/dash.totalComplaints*100):0;return <><Hero title="Operations, under control." text="Monitor every complaint, assign support staff, and keep resolution moving from one command center." action="＋ Manage complaints" onClick={()=>go('All Complaints')} metric={`${resolution}%`} metricLabel="Resolution rate"/><div className="section"><b>Admin command center</b><span>{loading?'Syncing…':'Live from database'}</span></div><div className="stats"><Stat n={dash.totalComplaints} t="Total Complaints" s="All service requests"/><Stat n={dash.submitted+dash.assigned+dash.inProgress+dash.reopened} t="Active Queue" s="Awaiting or in progress"/><Stat n={dash.resolved+dash.closed} t="Resolved" s="Completed requests"/><Stat n={dash.users} t="Users" s={`${dash.staff} support agents`}/></div><div className="grid"><section className="card panel"><div className="section"><h3>Latest complaints</h3><span className="muted">{complaints.length} total</span></div><ComplaintTable items={complaints.slice(0,6)} admin open={open}/></section><section className="card panel"><h3>Queue overview</h3><Queue label="Submitted" n={dash.submitted} total={dash.totalComplaints}/><Queue label="Assigned" n={dash.assigned} total={dash.totalComplaints}/><Queue label="In progress" n={dash.inProgress} total={dash.totalComplaints}/><Queue label="Reopened" n={dash.reopened} total={dash.totalComplaints}/><Queue label="Resolved / Closed" n={dash.resolved+dash.closed} total={dash.totalComplaints}/></section></div></>}
function AdminComplaints({complaints,staff,reload,loading,open}){const [q,setQ]=useState('');const [status,setStatus]=useState('ALL');const [priority,setPriority]=useState('ALL');const filtered=complaints.filter(c=>(!q||`${c.complaintNumber} ${c.title} ${c.customer?.name||''}`.toLowerCase().includes(q.toLowerCase()))&&(status==='ALL'||c.status===status)&&(priority==='ALL'||c.priority===priority));return <section className="card panel"><div className="section"><div><label>ADMIN WORKSPACE</label><h2>All complaints</h2><span>Review, assign, prioritize and monitor every service request.</span></div></div><div className="filters"><input placeholder="Search complaint, title or customer…" value={q} onChange={e=>setQ(e.target.value)}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="ALL">All priority</option>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>{loading?<p className="muted">Loading complaints…</p>:<div className="table-wrap"><table><thead><tr><th>Complaint</th><th>Customer</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned staff</th><th>Actions</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><button className="table-link" onClick={()=>open(c.id)}><b>{c.complaintNumber}</b><small>{c.title}</small></button></td><td>{c.customer?.name||'—'}</td><td>{c.category?.name||'Other'}</td><td><select className="compact" value={c.priority} onChange={async e=>{try{await api.put(`/admin/complaints/${c.id}/priority`,{priority:e.target.value});reload()}catch(err){alert(err.response?.data?.message||'Could not update priority')}}}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></td><td><span className={'status '+c.status.toLowerCase()}>{statusLabel(c.status)}</span></td><td>{c.staff?.name||<span className="muted">Unassigned</span>}</td><td><div className="action-row"><select className="compact" value={c.staff?.id||''} onChange={async e=>{if(!e.target.value)return;try{await api.put(`/admin/complaints/${c.id}/assign/${e.target.value}`);reload()}catch(err){alert(err.response?.data?.message||'Could not assign')}}}><option value="">Assign…</option>{staff.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select><button className="link" onClick={()=>open(c.id)}>View</button></div></td></tr>)}</tbody></table>{!filtered.length&&<EmptyText text="No complaints match these filters."/>}</div>}</section>}
function UserManagement({users,reload}){return <section className="card panel"><label>ADMIN WORKSPACE</label><h2>User management</h2><p className="muted">Manage customer and staff account access.</p><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.enabled?'Active':'Disabled'}</td><td>{u.role!=='ADMIN'&&<button className="link" onClick={async()=>{try{await api.put(`/admin/users/${u.id}/status?enabled=${!u.enabled}`);reload()}catch(e){alert(e.response?.data?.message||'Could not update user')}}}>{u.enabled?'Disable':'Enable'}</button>}</td></tr>)}</tbody></table></div></section>}
function StaffManagement({staff,complaints}){return <section className="card panel"><label>SUPPORT OPERATIONS</label><h2>Staff workload</h2><p className="muted">See how assigned complaints are distributed across support agents.</p><div className="staff-grid">{staff.map(s=>{const count=complaints.filter(c=>c.staff?.id===s.id&&!['RESOLVED','CLOSED','REJECTED'].includes(c.status)).length;return <div className="card mini" key={s.id}><div className="avatar">{s.name.slice(0,2).toUpperCase()}</div><b>{s.name}</b><small>{s.email}</small><strong>{count}</strong><span>active assignments</span></div>})}</div></section>}
function CategoryManagement({categories,reload}){const [form,setForm]=useState({name:'',description:'',active:true});const [editing,setEditing]=useState(null);const save=async()=>{if(!form.name.trim())return;try{if(editing)await api.put(`/admin/categories/${editing}`,form);else await api.post('/admin/categories',form);setForm({name:'',description:'',active:true});setEditing(null);reload()}catch(e){alert(e.response?.data?.message||'Could not save category')}};return <section className="card panel"><label>SERVICE CONFIGURATION</label><div className="section"><div><h2>Categories</h2><p className="muted">Create, edit and activate service categories.</p></div></div><div className="category-form"><input placeholder="Category name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><label className="check"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Active</label><button className="primary" onClick={save}>{editing?'Save changes':'Add category'}</button></div><div className="service-grid">{categories.map(c=><div className="card service" key={c.id}><span>✦</span><b>{c.name}</b><small>{c.description||'Service complaint category'}</small><div className="action-row"><span className={c.active?'status resolved':'status rejected'}>{c.active?'Active':'Inactive'}</span><button className="link" onClick={()=>{setEditing(c.id);setForm({name:c.name,description:c.description||'',active:c.active})}}>Edit</button></div></div>)}</div></section>}
function Analytics({dash}){const total=dash.totalComplaints||0;const pct=n=>total?Math.round(n/total*100):0;return <section><label>REPORTING</label><h2>Analytics & reports</h2><p className="muted">Operational snapshot from the complaint database.</p><div className="stats"><Stat n={dash.submitted} t="Submitted" s={`${pct(dash.submitted)}% of total`}/><Stat n={dash.assigned} t="Assigned" s={`${pct(dash.assigned)}% of total`}/><Stat n={dash.inProgress} t="In Progress" s={`${pct(dash.inProgress)}% of total`}/><Stat n={dash.reopened} t="Reopened" s={`${pct(dash.reopened)}% of total`}/><Stat n={dash.resolved+dash.closed} t="Completed" s={`${pct(dash.resolved+dash.closed)}% of total`}/><Stat n={dash.users} t="Users" s={`${dash.staff} staff`}/></div></section>}


function Staff({page,user}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const response = await api.get('/staff/complaints');
      setItems(response.data);
    } catch (err) {
      console.error('Could not load staff complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (page === 'Profile') return <Profile user={user}/>;

  return (
    <section className="card panel">
      <label>SUPPORT WORKSPACE</label>
      <h2>Assigned complaints</h2>
      <p className="muted">
        Update status, add notes and move requests toward resolution.
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Customer</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Update</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td>
                    <b>{c.complaintNumber}</b>
                    <small>{c.title}</small>
                  </td>

                  <td>{c.customer?.name || '—'}</td>

                  <td>
                    <span className={'priority ' + c.priority.toLowerCase()}>
                      {c.priority}
                    </span>
                  </td>

                  <td>
                    <span className={'status ' + c.status.toLowerCase()}>
                      {statusLabel(c.status)}
                    </span>
                  </td>

                  <td>
                    <select
                      className="compact"
                      value={c.status}
                      onChange={async e => {
                        if (e.target.value === c.status) return;

                        try {
                          await api.put(
                            `/staff/complaints/${c.id}/status`,
                            {
                              status: e.target.value,
                              remarks: `Status updated to ${statusLabel(e.target.value)}`
                            }
                          );

                          await load();
                        } catch (err) {
                          alert(
                            err.response?.data?.message ||
                            'Could not update status'
                          );
                          await load();
                        }
                      }}
                    >
                      {nextStatuses(c.status).map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <button
                      className="link"
                      onClick={() => setSelected(c.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!items.length && (
            <EmptyText text="No complaints are assigned to you." />
          )}
        </div>
      )}

      {selected && (
        <ComplaintDetail
          id={selected}
          close={() => setSelected(null)}
          refresh={load}
          role="STAFF"
        />
      )}
    </section>
  );
}


function Customer({page,user}){const [items,setItems]=useState([]),[cats,setCats]=useState([]),[show,setShow]=useState(page==='New Complaint'),[selected,setSelected]=useState(null);useEffect(()=>{api.get('/complaints/my').then(r=>setItems(r.data)).catch(console.error);api.get('/categories').then(r=>setCats(r.data)).catch(()=>{})},[]);useEffect(()=>{setShow(page==='New Complaint')},[page]);const refresh=()=>api.get('/complaints/my').then(r=>setItems(r.data));if(page==='My Complaints')return <section className="card panel"><div className="section"><div><label>MY WORKSPACE</label><h2>My complaints</h2></div><button className="primary" onClick={()=>setShow(true)}>＋ New complaint</button></div><ComplaintTable items={items} open={setSelected}/>{show&&<ComplaintModal cats={cats} close={()=>setShow(false)} refresh={refresh}/>} {selected&&<ComplaintDetail id={selected} close={()=>setSelected(null)} refresh={refresh} role="CUSTOMER"/>}</section>;if(page==='Services')return <section><label>SERVICE DIRECTORY</label><h2>What can we help with?</h2><div className="service-grid">{(cats.length?cats.map(x=>x.name):FALLBACK_CATEGORIES).map((x,i)=><div className="card service" key={x}><span>{['💧','⚡','🛣️','🧹','♻️','🚌','💡','✦'][i]}</span><b>{x}</b><small>Submit and track requests in this service.</small></div>)}</div></section>;if(page==='Profile')return <Profile user={user}/>;return <><Hero title="Your service, under control." text="Raise issues, follow every update and keep your service requests moving toward resolution." action="＋ Raise a complaint" onClick={()=>setShow(true)} metric={`${items.length?Math.round(items.filter(x=>['RESOLVED','CLOSED'].includes(x.status)).length/items.length*100):0}%`} metricLabel="Resolution rate"/><div className="section"><b>At a glance</b><span>Updated just now</span></div><div className="stats"><Stat n={items.length} t="Total Complaints" s="Your submitted requests"/><Stat n={items.filter(x=>!['RESOLVED','CLOSED','REJECTED'].includes(x.status)) .length} t="Active Requests" s="Currently open"/><Stat n={items.filter(x=>['RESOLVED','CLOSED'].includes(x.status)).length} t="Resolved" s="Completed requests"/><Stat n="24/7" t="Tracking" s="Status visibility"/></div><div className="grid"><section className="card panel"><div className="section"><h3>Recent complaints</h3><span className="muted">View details for history and discussion</span></div>{items.length?<ComplaintTable items={items.slice(0,5)} open={setSelected}/>:<Empty onClick={()=>setShow(true)}/>}</section><section className="card panel"><h3>Live request</h3>{items[0]?<Live complaint={items[0]} open={()=>setSelected(items[0].id)}/>:<Empty onClick={()=>setShow(true)}/>}</section></div>{show&&<ComplaintModal cats={cats} close={()=>setShow(false)} refresh={refresh}/>} {selected&&<ComplaintDetail id={selected} close={()=>setSelected(null)} refresh={refresh} role="CUSTOMER"/>}</>}

function ComplaintDetail({id,close,refresh,role}){
  const [data,setData]=useState(null),[history,setHistory]=useState([]),[comments,setComments]=useState([]),[message,setMessage]=useState(''),[rating,setRating]=useState(5),[feedback,setFeedback]=useState(''),[feedbackSubmitted,setFeedbackSubmitted]=useState(false),[busy,setBusy]=useState(false);
  
  const load=async()=>{try{const [c,h,m]=await Promise.all([api.get(`/complaints/${id}`),api.get(`/complaints/${id}/history`),api.get(`/complaints/${id}/comments`)]);setData(c.data);setHistory(h.data);setComments(m.data)}catch(e){alert(e.response?.data?.message||'Could not load complaint')}};useEffect(()=>{load()},[id]);if(!data)return <div className="modal"><div className="modal-card"><p>Loading complaint…</p></div></div>;const canReopen=role==='CUSTOMER'&&['RESOLVED','CLOSED'].includes(data.status);const canFeedback=role==='CUSTOMER'&&['RESOLVED','CLOSED'].includes(data.status);const submitComment=async()=>{if(!message.trim())return;setBusy(true);try{await api.post(`/complaints/${id}/comments`,{message});setMessage('');await load()}catch(e){alert(e.response?.data?.message||'Could not add comment')}finally{setBusy(false)}};const reopen=async()=>{try{await api.post(`/complaints/${id}/reopen`);await load();refresh?.()}catch(e){alert(e.response?.data?.message||'Could not reopen complaint')}};
  
  const submitFeedback=async()=>{
  if(feedbackSubmitted)return;

  try{
    await api.post(`/complaints/${id}/feedback`,{
      rating,
      comment:feedback
    });

    setFeedback('');
    setFeedbackSubmitted(true);
    alert('Feedback submitted');
    await load();
  }catch(e){
    const msg=e.response?.data?.message||'Could not submit feedback';

    if(msg.toLowerCase().includes('already')){
      setFeedbackSubmitted(true);
    }

    alert(msg);
  }
};
  
  return <div className="modal"><div className="modal-card detail-card"><div className="section"><div><label>COMPLAINT DETAILS</label><h2>{data.complaintNumber}</h2><span>{data.title}</span></div><button className="close" onClick={close}>×</button></div><div className="detail-grid"><div><b>Status</b><span className={'status '+data.status.toLowerCase()}>{statusLabel(data.status)}</span></div><div><b>Priority</b><span className={'priority '+data.priority.toLowerCase()}>{data.priority}</span></div><div><b>Category</b><span>{data.category?.name||'Other'}</span></div><div><b>Customer</b><span>{data.customer?.name||'—'}</span></div><div><b>Staff</b><span>{data.staff?.name||'Unassigned'}</span></div><div><b>Created</b><span>{data.createdAt?new Date(data.createdAt).toLocaleString():'—'}</span></div></div><p className="detail-description">{data.description}</p>{data.location&&<p className="muted"><b>Location:</b> {data.location}</p>}<h3>Timeline</h3><div className="timeline">{history.map((h,i)=><div className="event current" key={h.id||i}><i/><div><b>{statusLabel(h.newStatus)}</b><small>{h.remarks||'Status updated'} · {h.changedBy?.name||'System'} · {h.changedAt?new Date(h.changedAt).toLocaleString():''}</small></div></div>)}</div><div className="detail-actions">{role==='ADMIN'&&<select className="compact" value={data.status} onChange={async e=>{if(e.target.value===data.status)return;try{await api.put(`/admin/complaints/${id}/status`,{status:e.target.value,remarks:`Admin changed status to ${statusLabel(e.target.value)}`});await load();refresh?.()}catch(err){alert(err.response?.data?.message||'Could not update status')}}}>{nextStatuses(data.status).map(s=><option key={s}>{s}</option>)}</select>}{role==='STAFF'&&<select className="compact" value={data.status} onChange={async e=>{if(e.target.value===data.status)return;try{await api.put(`/staff/complaints/${id}/status`,{status:e.target.value,remarks:`Status updated to ${statusLabel(e.target.value)}`});await load();refresh?.()}catch(err){alert(err.response?.data?.message||'Could not update status')}}}>{nextStatuses(data.status).map(s=><option key={s}>{s}</option>)}</select>}</div><h3>Comments</h3><div className="comments">{comments.length?comments.map(c=><div className="comment" key={c.id}><b>{c.user?.name||'User'}</b><small>{c.createdAt?new Date(c.createdAt).toLocaleString():''}</small><p>{c.message}</p></div>):<span className="muted">No comments yet.</span>}</div><div className="comment-box"><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Add a comment or update note…"/><button className="primary" disabled={busy} onClick={submitComment}>Add comment</button></div>{canReopen&&<button className="ghost full" onClick={reopen}>↻ Reopen complaint</button>}{canFeedback&&<div className="feedback"><h3>Service feedback</h3><select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(x=><option key={x} value={x}>{x} / 5</option>)}</select><textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Tell us about your experience…"/>
  
  <button
  className="primary"
  disabled={feedbackSubmitted}
  onClick={submitFeedback}
>
  {feedbackSubmitted ? '✓ Feedback submitted' : 'Submit feedback'}
</button>
  
  </div>}</div></div>}
function ComplaintModal({cats,close,refresh}){const [f,setF]=useState({title:'',description:'',categoryId:'',priority:'MEDIUM',location:'',attachmentUrl:''});const [busy,setBusy]=useState(false);return <div className="modal"><form className="modal-card" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await api.post('/complaints',{...f,categoryId:f.categoryId?Number(f.categoryId):null,attachmentUrl:f.attachmentUrl||null});close();await refresh();alert('Complaint submitted successfully')}catch(e){alert(e.response?.data?.message||'Could not submit complaint')}finally{setBusy(false)}}}><div className="section"><div><label>NEW REQUEST</label><h2>Raise a complaint</h2></div><button type="button" className="close" onClick={close}>×</button></div><label>Complaint title<input required maxLength="200" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label><label>Category<select required value={f.categoryId} onChange={e=>setF({...f,categoryId:e.target.value})}><option value="">Select category</option>{cats.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Priority<select value={f.priority} onChange={e=>setF({...f,priority:e.target.value})}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></label><label>Location<input maxLength="500" value={f.location} onChange={e=>setF({...f,location:e.target.value})}/></label><label>Attachment URL <span className="muted">optional</span><input maxLength="1000" value={f.attachmentUrl} onChange={e=>setF({...f,attachmentUrl:e.target.value})} placeholder="https://…"/></label><label>Description<textarea required maxLength="4000" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label><button className="primary" disabled={busy}>{busy?'Submitting…':'Submit complaint'}</button></form></div>}
function Hero({title,text,action,onClick,metric,metricLabel}){return <section className="hero"><div><label>SMARTSERVE / COMMAND CENTER</label><h1>{title}</h1><p>{text}</p><div className="actions"><button className="primary" onClick={onClick}>{action}</button></div></div><div className="metric"><small>{metricLabel}</small><strong>{metric}</strong><span>Live from your workspace</span></div></section>}
const nextStatuses=s=>({ASSIGNED:['ASSIGNED','IN_PROGRESS','REJECTED'],IN_PROGRESS:['IN_PROGRESS','RESOLVED'],RESOLVED:['RESOLVED','CLOSED','REOPENED'],CLOSED:['CLOSED','REOPENED'],REOPENED:['REOPENED','IN_PROGRESS']}[s]||[s]);
const Stat=({n,t,s})=><div className="card stat"><span>{t}</span><strong>{n}</strong><small>{s}</small></div>;
const Queue=({label,n,total})=><div className="queue"><div><b>{label}</b><span>{n}</span></div><div className="progress"><i style={{width:`${Math.min(100,Math.round(n/(total||1)*100))}%`}}/></div></div>;
const Empty=({onClick})=><div className="empty"><b>No complaints yet</b><span>Start with your first service request.</span><button className="primary" onClick={onClick}>Raise complaint</button></div>;
const EmptyText=({text})=><div className="empty"><b>{text}</b></div>;
const Live=({complaint:c,open})=><div className="live"><div className="live-head"><b>{c.complaintNumber}</b><span>{statusLabel(c.status)}</span></div><div className="progress"><i style={{width:`${progress[c.status]||20}%`}}/></div><div className="timeline">{['SUBMITTED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED'].map((s,i)=><div className={c.status===s?'event current':'event'} key={s}><i/><div><b>{statusLabel(s)}</b><small>{i<=['SUBMITTED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED'].indexOf(c.status)?'Reached':'Pending'}</small></div></div>)}</div><button className="link full" onClick={open}>View full complaint →</button></div>;
const ComplaintTable=({items,admin=false,open})=><div className="table-wrap"><table><thead><tr><th>Complaint</th>{admin&&<th>Customer</th>}<th>Category</th><th>Priority</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>{items.map(c=><tr key={c.id}><td><button className="table-link" onClick={()=>open?.(c.id)}><b>{c.complaintNumber}</b><small>{c.title}</small></button></td>{admin&&<td>{c.customer?.name||'—'}</td>}<td>{c.category?.name||'Other'}</td><td><span className={'priority '+c.priority.toLowerCase()}>{c.priority}</span></td><td><span className={'status '+c.status.toLowerCase()}>{statusLabel(c.status)}</span></td><td>{c.updatedAt?new Date(c.updatedAt).toLocaleString():''}</td><td><button className="link" onClick={()=>open?.(c.id)}>View</button></td></tr>)}</tbody></table></div>;

function Profile({user}) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    users: 0,
    staff: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (user.role === 'ADMIN') {
          const r = await api.get('/admin/dashboard');

          setStats({
            total: r.data.totalComplaints || 0,
            active:
              (r.data.submitted || 0) +
              (r.data.assigned || 0) +
              (r.data.inProgress || 0) +
              (r.data.reopened || 0),
            resolved:
              (r.data.resolved || 0) +
              (r.data.closed || 0),
            users: r.data.users || 0,
            staff: r.data.staff || 0
          });
        }

        if (user.role === 'STAFF') {
          const r = await api.get('/staff/complaints');
          const complaints = r.data || [];

          setStats({
            total: complaints.length,
            active: complaints.filter(
              c => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)
            ).length,
            resolved: complaints.filter(
              c => ['RESOLVED', 'CLOSED'].includes(c.status)
            ).length,
            users: 0,
            staff: 0
          });
        }

        if (user.role === 'CUSTOMER') {
          const r = await api.get('/complaints/my');
          const complaints = r.data || [];

          setStats({
            total: complaints.length,
            active: complaints.filter(
              c => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)
            ).length,
            resolved: complaints.filter(
              c => ['RESOLVED', 'CLOSED'].includes(c.status)
            ).length,
            users: 0,
            staff: 0
          });
        }
      } catch (err) {
        console.error('Could not load profile statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user.role]);

  const roleName =
    user.role === 'ADMIN'
      ? 'Administrator'
      : user.role === 'STAFF'
        ? 'Support Agent'
        : 'Customer';

  return (
    <section>
      <div className="section">
        <div>
          <label>ACCOUNT</label>
          <h2>My Profile</h2>
          <p className="muted">
            Your SmartServe account and workspace information.
          </p>
        </div>
      </div>

      <div className="card panel profile">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>

          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
            <span className="status resolved">{roleName}</span>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <b>Full Name</b>
            <span>{user.name || '—'}</span>
          </div>

          <div>
            <b>Email Address</b>
            <span>{user.email || '—'}</span>
          </div>

          <div>
            <b>Role</b>
            <span>{roleName}</span>
          </div>

          <div>
            <b>Account Status</b>
            <span className="status resolved">Active</span>
          </div>
        </div>
      </div>

      <div className="section">
        <b>Workspace statistics</b>
        <span>{loading ? 'Loading…' : 'Live from database'}</span>
      </div>

      <div className="stats">
        {user.role === 'ADMIN' ? (
          <>
            <Stat
              n={stats.total}
              t="Total Complaints"
              s="All service requests"
            />

            <Stat
              n={stats.users}
              t="Total Users"
              s="Registered users"
            />

            <Stat
              n={stats.staff}
              t="Support Staff"
              s="Active support agents"
            />

            <Stat
              n={stats.resolved}
              t="Completed"
              s="Resolved / closed"
            />
          </>
        ) : (
          <>
            <Stat
              n={stats.total}
              t="Total Complaints"
              s="Your service requests"
            />

            <Stat
              n={stats.active}
              t="Active"
              s="Currently open"
            />

            <Stat
              n={stats.resolved}
              t="Resolved"
              s="Completed requests"
            />

            <Stat
              n="24/7"
              t="Tracking"
              s="Status visibility"
            />
          </>
        )}
      </div>
    </section>
  );
}


function Auth({onLogin}){const [mode,setMode]=useState('login');const [f,setF]=useState({name:'',email:'',password:'',phone:'',address:''});const [busy,setBusy]=useState(false);async function go(e){e.preventDefault();setBusy(true);try{const r=await api.post('/auth/'+mode,{...f,email:f.email.trim().toLowerCase()});localStorage.setItem('smartserve_token',r.data.token);localStorage.setItem('smartserve_user',JSON.stringify(r.data));onLogin(r.data)}catch(e){alert(e.response?.data?.message||'Authentication failed')}finally{setBusy(false)}}return <div className="auth"><div className="auth-card"><div className="logo">S</div><label>SmartServe</label><h1>{mode==='login'?'Welcome back.':'Create your account.'}</h1><p>{mode==='login'?'Sign in to manage your service requests.':'Join the complaint management portal.'}</p><form onSubmit={go}>{mode==='register'&&<input required maxLength="100" placeholder="Full name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>}<input required type="email" placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><input required minLength="6" type="password" placeholder="Password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>{mode==='register'&&<><input maxLength="30" placeholder="Phone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><input maxLength="300" placeholder="Address" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></>}<button className="primary" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form><button className="switch" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'New here? Create account':'Already registered? Sign in'}</button><small className="demo">Demo staff: staff@smartserve.local / Staff@123 · Admin: admin@smartserve.local / Admin@123</small></div></div>}
