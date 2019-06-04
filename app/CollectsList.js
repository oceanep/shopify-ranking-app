import React from "react";
import axios from "axios";
import {Page, PageActions, Thumbnail, ResourceList, Card, TextStyle, Modal, TextContainer, RangeSlider, Pagination} from "@shopify/polaris";
import CollectsListFooter from "./CollectsListFooter/CollectsListFooter"

const isEmpty = (obj) => {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}

export default class CollectsList extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      collectionInfo: this.props.collection,
      currentCollects: [''],
      allCollects: [''],
      selectedItems: [],
      itemsToDelete: [],
      searchValue: '',
      isFirstPage: true,
      isLastPage: false,
      loading: true,
      modalActive: false,
      modalType: '',
      new: this.props.new,
      timeInterval: this.props.collection.timeRange ? this.props.collection.timeRange : 7
    }

    this.handleTimeInterval = this.handleTimeInterval.bind(this)
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.handleSelectionChange = this.handleSelectionChange.bind(this)
    this.handleModalChange = this.handleModalChange.bind(this)
    this.handlePreviousPage = this.handlePreviousPage.bind(this)
    this.handleNextPage = this.handleNextPage.bind(this)
  }

  componentDidMount() {

    axios.get(`https://56a2492b.ngrok.io/getShopifyProducts/${this.state.collectionInfo.id}`)
    .then( res => {
      console.log(res.data)
      isEmpty(res.data) ? this.setState({currentCollects: [], loading: false})
        :
        res.data.products.length > 50 ? this.setState({currentCollects: res.data.products.slice(0,50), allCollects: res.data.products, loading: false})
          :
          this.setState({currentCollects: res.data.products, allCollects: res.data.products, loading: false})

    })
    .catch(err => {
      console.log(err)
    })
  }

  handleTimeInterval = (timeInterval) => {
    this.setState({timeInterval})
  }

  handleSearchChange = (searchValue) => {
    this.setState({searchValue})
  }

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems})
  }

  handlePreviousPage = () => {
    //compare all Collects and current Collects indexes to decide new indexes to slice for next page current Collects
    const end = this.state.allCollects.findIndex( collect => collect.id === this.state.currentCollects[0].id )
    const start = end - 50
    const currentCollects = this.state.allCollects.slice(start, end)
    console.log ("paginate previous page", start, end, currentCollects)
    // figure out how to determine if items represent
    // first or last page.
    this.setState({ currentCollects, isFirstPage: end > 50 ? false : true, isLastPage: false });
  }

  handleNextPage = () => {
    //compare all Collects and current Collects indexes to decide new indexes to slice for next page current Collects
    const arrLength = this.state.currentCollects.length
    const start = this.state.allCollects.findIndex( collect => collect.id === this.state.currentCollects[arrLength - 1].id ) +1
    const end = start + 50
    const currentCollects = this.state.allCollects.slice(start, end)
    console.log ("paginate next page", start, end, currentCollects)
    // Todo: figure out how to determine if items represent
    // first or last page.
    this.setState({ currentCollects, isFirstPage: false, isLastPage: end >= this.state.allCollects.length ? true : false });
  }

  handleCollectionDelete = () => {
    //hit collection delete endpoint on backend and shopify
    console.log('handle Collection delete')
    this.handleModalChange('')
    this.props.onSelect('delete')
  }

  handleItemsDelete = () => {
    //set list of items to send back for deletion on save/finish
    this.setState({ itemsToDelete: this.state.selectedItems})
    this.handleModalChange('')
    console.log('handle item deletion')
  }

  handleModalChange = (modalType) => {
    this.setState({modalType})
    this.setState(({modalActive}) => ({modalActive: !modalActive}))
  }

  handleRestore = () => {
    //hit restore endpoint on backend
    console.log('handle restore')
    this.handleModalChange('')
    this.props.onSelect('restore')
  }

  handleSave = () => {
    if(this.state.new) {
      //send collection id, timeInterval, type, itemstodelete array, and rules to create endpoint on backend
      this.props.onSelect('complete')
    }else{
      //send id, timeInterval to the update endpoint
      //if items to delete? send items to delete endpoint on backend
      this.props.onSelect('update')
    }
  }

  renderItem = (item) => {
    const {id, title, imgSrc} = item
    const media = <Thumbnail size="small" source={imgSrc} alt={title} />

    return (
      <ResourceList.Item
        id={id}
        media={media}
        accessibilityLabel={`Product ${title}`}
        persistActions
      >
        <h3>
          <TextStyle variation="strong">{title}</TextStyle>
        </h3>
      </ResourceList.Item>
    )
  }

  renderModal = () => {
    const {modalType} = this.state
    const deleteCollectionModalInfo = {
      title: "Delete this ranked Collection?",
      action: {
        content: 'Delete Ranked Collection',
        onAction: this.handleCollectionDelete,
      },
      text: 'Please confirm the decision to delete this ranked collection.'
    }

    const deleteProductsModalInfo = {
      title: "Delete these products?",
      action: {
        content: 'Delete Products',
        onAction: this.handleItemsDelete,
      },
      text: 'Please confirm the decision to delete these products from this ranked collection. They will be deleted on save/update'
    }

    const restoreProductsModalInfo = {
      title: "Restore previously deleted products?",
      action: {
        content: 'Restore',
        onAction: this.handleRestore,
      },
      text: 'Please confirm the decision to restore previously deleted products from this ranked collection'
    }

    return (
      <Modal
          open={this.state.modalActive}
          onClose={this.handleModalChange}
          title={
            modalType == 'collection' ? deleteCollectionModalInfo.title
            : modalType == 'restore' ? restoreProductsModalInfo.title
            : modalType == 'products' ? deleteProductsModalInfo.title
            : ''
          }
          primaryAction={
            modalType == 'collection' ? deleteCollectionModalInfo.action
            : modalType == 'restore' ? restoreProductsModalInfo.action
            : modalType == 'products' ? deleteProductsModalInfo.action
            : ''
          }
        >
          <Modal.Section>
            <TextContainer>
              <p>
                {
                  modalType == 'collection' ? deleteCollectionModalInfo.text
                  : modalType == 'restore' ? restoreProductsModalInfo.text
                  : modalType == 'products' ? deleteProductsModalInfo.text
                  : ''
                }
              </p>
            </TextContainer>
          </Modal.Section>
        </Modal>
    )
  }

  render() {
    const resourceName = {
      singular: 'product',
      plural: 'products',
    }
    const promotedBulkActions = [
      {
        content: 'Delete Products',
        onAction: () => {this.handleModalChange('products')},
      }
    ]
    const filterControl = (
      <ResourceList.FilterControl
        searchValue={this.state.searchValue}
        onSearchChange={this.handleSearchChange}
      />
    )

    const paginationMarkup = this.state.currentCollects.length > 0
      ? (
        <CollectsListFooter>
          <Pagination
            hasPrevious={!this.state.isFirstPage}
            hasNext={!this.state.isLastPage}
            onPrevious={this.handlePreviousPage}
            onNext={this.handleNextPage}
          />
        </CollectsListFooter>
      )
      : null

    return (
      <React.Fragment>
        {this.renderModal()}
        <Card>
          <div style={{padding: "1em"}}>
            <RangeSlider
              label="How far back would you like to rank by?"
              value={this.state.timeInterval}
              onChange={this.handleTimeInterval}
              min={7}
              max={180}
              output
            />
          </div>
        </Card>
        <Card>
          <ResourceList
            resourceName={resourceName}
            items={this.state.currentCollects}
            renderItem={this.renderItem}
            selectedItems={this.state.selectedItems}
            onSelectionChange={this.handleSelectionChange}
            promotedBulkActions={promotedBulkActions}
            filterControl={filterControl}
            hasMoreItems={this.state.allCollects.length > 50 ? true : false }
            loading={this.state.loading}
          />
        </Card>

        {paginationMarkup}

        { this.state.new ?
          <PageActions
            primaryAction={{ content:'Save', onAction: this.handleSave}}
            secondaryActions={[
              { content: 'Back', onAction: () => {this.props.onSelect('landing')}}
            ]}
          />
          :
          <PageActions
            primaryAction={{ content:'Update', onAction: this.handleSave}}
            secondaryActions={[
              { content: 'Back', onAction: () => {this.props.onSelect('landing')}},
              { content: 'Restore', onAction: () => {this.handleModalChange('restore')}},
              { content: 'Delete Collection', onAction: () => {this.handleModalChange('collection')}}
            ]}
          />
        }
      </React.Fragment>
    );
  }
}
