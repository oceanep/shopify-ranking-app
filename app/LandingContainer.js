import React from "react";
import {Page, PageActions, Button, Banner, TextContainer, Heading} from "@shopify/polaris";
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
            <React.Fragment>
              <TextContainer>
                <p>
                  <Heading>This app creates a new “ranked” collection by ranking the products in an existing collection, and creating a new one.</Heading>
                  <br/>-The ranking is done by frequency of products ordered, within a user-set time frame.
                  <br/>-Every night the collections are updated with new ranks.
                  <br/>-You’ll be able to choose items you don’t want in the new ranked collection, however if you’d like these items back please click “restore” and the collection will have all its products back when it re-ranks.
                </p>
                <Heading>RULES</Heading>
                <p>
                  <br/>- do not change the sort order of the collections (leave as manual)
                  <br/>- low ranking products will appear at the bottom of smart collections, they will be deleted from custom collections
                  <br/>- ranked collections must be deleted within the app
                  <br/>- ranked collections will be restored overnight
                </p>
              </TextContainer>
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
            </React.Fragment>
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
          {this.state.currentComponent == 'complete'? <Banner title="Ranking in Progress" status="info" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                        <p>Ranking can take up to an hour to complete. Your ranked collection will appear in your collections page when complete.
                                                          <br/>NOTE: Products deleted from a Smart Collection through this app will still appear in the collection's products, but will be exlcuded from ranking and pushed to the bottom of the Ranked Collection.
                                                          <br/>NOTE: Changing the sort order type within the Shopify collection admin page WILL erase your ranked collection order until the next day.
                                                        </p>
                                                      </Banner>
            : null
          }
          {this.state.currentComponent == 'restore'? <Banner title="Restore Request Received" status="success" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>The previously deleted items from this ranked collection will be restored and ranked during this collection's scheduled reranking process.</p>
                                                    </Banner>
            : null
          }
          {this.state.currentComponent == 'update'? <Banner title="Update Has Been Received" status="success" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>Your ranked collection will be updated during it's scheduled reranking process.
                                                        <br/>NOTE: Products deleted from a Smart Collection through this app will still appear in the collection's products, but will be exlcuded from ranking and pushed to the bottom of the Ranked Collection.
                                                        <br/>NOTE: Changing the sort order type within the Shopify collection admin page WILL erase your ranked collection order until the next day.
                                                      </p>
                                                    </Banner>
            : null
          }
          {this.state.currentComponent == 'delete'? <Banner title="Ranked Collection Deleted" status="success" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>Your ranked collection has been deleted from our database, it will still exist in shopify's admin page but will no longer be ranked and updated.</p>
                                                    </Banner>
            : null
          }
          {this.state.currentComponent == 'error'? <Banner title="There Was An Error Ranking Your Collection" status="critical" onDismiss={() => {this.setCurrentComponent('landing')}}>
                                                      <p>An error occured on our servers, please select your collection and try again.</p>
                                                    </Banner>
            : null
          }
        </Page>
      </div>
    );
  }
}
