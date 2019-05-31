import React from "react";
import {Page, PageActions, Button, Select} from "@shopify/polaris";

const later = (delay, value) =>
    new Promise(resolve => setTimeout(resolve, delay, value));

export default class CollectionDropdown extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      selected: '',
      collections: []
    }
  }

  componentDidMount() {
    //check this.props.type and decide which collections api to ping
    later(1000, ['collection1','collection2','collection3']).then(
      res => {
        console.log(res)
        this.setState({collections: this.mapCollections(res)})
      }
    ).catch(err => console.log(err))
  }

  //map results from api into usable array of collection names w/ ids
  mapCollections = collections => {
    return collections.map(collection => ({label: collection, value: collection, id: collection}))
  }

  handleChange = (newValue) => {
    this.setState({selected: newValue})
  }

  selectCollection = (e) => {
    e.preventDefault()
    let id = this.state.collections.find(collection => this.state.selected == collection.value).id
    console.log(this.state.selected, id)
    this.props.setCollectionId(id)
    this.props.onSelect('collects')
  }

  render() {
    return (
      <React.Fragment>
        <Select
          label="Collections"
          options={this.state.collections}
          onChange={this.handleChange}
          value={this.state.selected}
          placeholder="Select a Collection"
        />
        <PageActions
          primaryAction={{ content:'Select', onAction: this.selectCollection }}
          secondaryActions={[{ content: 'Cancel', onAction: () => {this.props.onSelect('landing')}}]}
        />
      </React.Fragment>
    );
  }
}
// <ButtonGroup>
//   <Button onclick={() => {this.props.onSelect('landing')}}>Cancel</Button>
//   <Button primary onClick={this.selectCollection}>Select</Button>
// </ButtonGroup>
