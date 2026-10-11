import React, { Suspense, lazy } from 'react';
const ProjectPeopleCommitments=lazy(()=>import('@/components/projects/ProjectPeopleCommitments'));
export default class ProjectCapacitySection extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error){console.error('Project capacity panel failed',error);}
  componentDidUpdate(previous){if(previous.project.id!==this.props.project.id && this.state.failed)this.setState({failed:false});}
  render(){
    if(this.state.failed)return <section className="ws-card ws-panel" role="alert"><h3 className="ws-sectiontitle">Team capacity</h3><p className="mt-2 text-xs text-muted-foreground">Capacity could not be displayed. The rest of this project is still available.</p><button type="button" onClick={()=>window.location.reload()} className="mt-2 text-xs text-chart-2 underline">Reload capacity</button></section>;
    return <Suspense fallback={<p role="status" className="text-xs text-muted-foreground">Loading team capacity…</p>}><ProjectPeopleCommitments project={this.props.project}/></Suspense>;
  }
}