import React from "react";
import axios from "axios";
import {Page, PageActions, Button, Select} from "@shopify/polaris";

const later = (delay, value) =>
    new Promise(resolve => setTimeout(resolve, delay, value));

export default class CollectionDropdown extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      selected: '',
      selectedIndex: '',
      collectionObjs: [],
      collections: [],
      newRanking: this.props.new
    }
  }

  componentDidMount() {
    //check newRanking and decide which collections api to ping
    //if new, ping middleware to ping all Collections
    //if not, ping middleware for all ranked collections
    let url = this.state.newRanking? 'getShopifyCollections' : 'getAllRankedCollections'
    axios.get(`${process.env.API_URL}/${url}`)
    .then( res => {
      console.log(this.state.newRanking? res.data.collections: res.data)
      this.setState({collectionObjs: this.state.newRanking? res.data.collections: res.data})
      this.setState({collections: this.mapCollections( this.state.newRanking? res.data.collections: res.data)})
    })
    .catch(err => {
      console.log(err)
    })
  }

  //map results from api into usable array of collection names w/ ids
  mapCollections = collections => {
    return collections.map(collection => ({label: collection.title, value: collection.id}))
  }

  handleChange = (newValue) => {
    this.setState({selected: newValue})
  }

  selectCollection = () => {
    let c = this.state.collectionObjs.find(collection => this.state.selected == collection.id)
    console.log("selected collection obj",this.state.selected, c)
    this.props.setCollection(c)
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
          secondaryActions={[{ content: 'Back', onAction: () => {this.props.onSelect('landing')}}]}
        />
      </React.Fragment>
    );
  }
}
// <ButtonGroup>
//   <Button onclick={() => {this.props.onSelect('landing')}}>Cancel</Button>
//   <Button primary onClick={this.selectCollection}>Select</Button>
// </ButtonGroup>
