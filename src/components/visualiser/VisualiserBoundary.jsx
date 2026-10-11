import React from 'react';
import {Button} from '@/components/ui/button';
export default class VisualiserBoundary extends React.Component{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div role="alert" className="rounded-panel border border-border bg-card p-8 text-center"><h3 className="font-heading font-semibold">{this.props.view?'This view is unavailable':'The visualiser could not load'}</h3><p className="mt-2 text-sm text-muted-foreground">{this.props.view?'Your browser may not support this 3D view. The 2D plan and project workspace remain available.':'The rest of your project workspace is unaffected.'}</p><Button className="mt-4" variant="outline" onClick={()=>{this.setState({failed:false});this.props.onFallback?.();}}>{this.props.view?'Return to 2D plan':'Try again'}</Button></div>:this.props.children;}
}