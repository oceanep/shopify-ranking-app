import React from "react";
import LandingContainer from "./LandingContainer.js";
import {AppProvider, EmptyState} from "@shopify/polaris";

export default class App extends React.Component {
  componentDidMount(){
    console.log(process.env.API_URL)
  }
  render() {
    return (
      <AppProvider>
        <LandingContainer/>
      </AppProvider>
    );
  }
}

//home container
//  [new] [ranked]
//  set state {showdropdown true, previouslyranked?}
//  new/ranked dropdown component
//    query for collections
//    display dropdown of collections [go]
//      on delete setState{showdropdown false}, hit delete api
//  set state {showdropdown false, showcollection true}
//  collection component
//    query for collection collects
//    display collects
//    [cancel] (if previouslyranked? [delete]) [restore] [save]
