import React from "react";
import {Page, PageActions, Button, Banner} from "@shopify/polaris";
import CollectionDropdown from "./CollectionDropdown.js";
import CollectsList from "./CollectsList.js";

export default class LandingComponent extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showDropdown: false,
      previouslyRanked: false,
      currentComponent: 'landing',
      collectionId: ''
    }
  }

  setCurrentComponent = (currentComponent) => {
    this.setState({currentComponent})
  }

  setQueryCollectionId = (collectionId) => {
    this.setState({collectionId})
  }

  render() {
    return (
      <div>
        <Page
          title="Product Ranking App"
        >
          {this.state.currentComponent == 'landing' ?
            <PageActions
              primaryAction={{ content:'Ranked Collections', onAction: () => {this.setCurrentComponent('rankedCollections')}}}
              secondaryActions={[{ content: 'New Ranking', onAction: () => {this.setCurrentComponent('allCollections')}}]}
            />
          : null}

          {this.state.currentComponent == 'rankedCollections'? <CollectionDropdown
                                                                 type={'ranked'}
                                                                 onSelect={this.setCurrentComponent.bind(this)}
                                                                 setCollectionId={this.setQueryCollectionId.bind(this)}
                                                                />
            : null
          }
          {this.state.currentComponent == 'allCollections'? <CollectionDropdown
                                                              type={'all'}
                                                              onSelect={this.setCurrentComponent.bind(this)}
                                                              setCollectionId={this.setQueryCollectionId.bind(this)}
                                                            />
            : null
          }
          {this.state.currentComponent == 'collects'? <CollectsList
                                                        type={this.state.type}
                                                        onSelect={this.setCurrentComponent.bind(this)}
                                                        collectionId={this.state.collectionId}
                                                      />
            : null
          }
          {this.state.currentComponent == 'complete'? <Banner title="Ranking in Progress" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                        <p>Ranking can take up to an hour to complete. Your ranked collection will appear in your collections page when complete.</p>
                                                      </Banner>
            : null
          }
        </Page>
      </div>
    );
  }
}
