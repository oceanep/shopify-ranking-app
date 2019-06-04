import React from "react";
import {Page, PageActions, Button, Banner} from "@shopify/polaris";
import CollectionDropdown from "./CollectionDropdown.js";
import CollectsList from "./CollectsList.js";

export default class LandingComponent extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showDropdown: false,
      currentComponent: 'landing',
      collection: {},
      newRanking: false
    }
  }

  setCurrentComponent = (currentComponent) => {
    this.setState({currentComponent})
  }

  isNewRanking = (newRanking) => {
    this.setState({newRanking})
  }

  setQueryCollection = (collection) => {
    this.setState({collection})
  }

  render() {
    return (
      <div>
        <Page
          title="Product Ranking App"
        >
          {this.state.currentComponent == 'landing' ?
            <PageActions
              primaryAction={{ content:'Ranked Collections', onAction: () => {
                this.setCurrentComponent('rankedCollections')
                this.isNewRanking(false)
              }}}
              secondaryActions={[{ content: 'New Ranking', onAction: () => {
                this.setCurrentComponent('allCollections')
                this.isNewRanking(true)
              }}]}
            />
          : null}

          {this.state.currentComponent == 'rankedCollections'? <CollectionDropdown
                                                                 new={this.state.newRanking}
                                                                 onSelect={this.setCurrentComponent.bind(this)}
                                                                 setCollection={this.setQueryCollection.bind(this)}
                                                                />
            : null
          }
          {this.state.currentComponent == 'allCollections'? <CollectionDropdown
                                                              new={this.state.newRanking}
                                                              onSelect={this.setCurrentComponent.bind(this)}
                                                              setCollection={this.setQueryCollection.bind(this)}
                                                            />
            : null
          }
          {this.state.currentComponent == 'collects'? <CollectsList
                                                        new={this.state.newRanking}
                                                        onSelect={this.setCurrentComponent.bind(this)}
                                                        collection={this.state.collection}
                                                      />
            : null
          }
          {this.state.currentComponent == 'complete'? <Banner title="Ranking in Progress" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                        <p>Ranking can take up to an hour to complete. Your ranked collection will appear in your collections page when complete.
                                                          <br/>NOTE: Products deleted from a Smart Collection through this app will still appear in the collection's products, but will be exlcuded from ranking and pushed to the bottom of the Ranked Collection.
                                                          <br/>NOTE: Changing the sort order type within the Shopify collection admin page WILL erase your ranked collection order until the next day.
                                                        </p>
                                                      </Banner>
            : null
          }
          {this.state.currentComponent == 'restore'? <Banner title="Restore Request Received" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>The previously deleted items from this ranked collection will be restored and ranked during this collection's scheduled reranking process.</p>
                                                    </Banner>
            : null
          }
          {this.state.currentComponent == 'update'? <Banner title="Update Has Been Received" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>Your ranked collection will be updated during it's scheduled reranking process.
                                                        <br/>NOTE: Products deleted from a Smart Collection through this app will still appear in the collection's products, but will be exlcuded from ranking and pushed to the bottom of the Ranked Collection.
                                                        <br/>NOTE: Changing the sort order type within the Shopify collection admin page WILL erase your ranked collection order until the next day.
                                                      </p>
                                                    </Banner>
            : null
          }
          {this.state.currentComponent == 'delete'? <Banner title="Ranked Collection Deleted" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>Your ranked collection has been deleted from our database and shopify's admin page.</p>
                                                    </Banner>
            : null
          }
        </Page>
      </div>
    );
  }
}