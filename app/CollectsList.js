import React from "react";
import {Page, PageActions, Thumbnail, ResourceList, Card, TextStyle, Modal, TextContainer} from "@shopify/polaris";

const later = (delay, value) =>
    new Promise(resolve => setTimeout(resolve, delay, value));

export default class CollectsList extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      collectionInfo: { id: this.props.collectionId, type: this.props.type},
      collects: [''],
      selectedItems: [],
      searchValue: '',
      loading: true,
      modalActive: false,
      deleteCollection: false
    }
  }

  componentDidMount() {
    later(1000, [
        {id: '134u2y34uy34', url: '2112771129411', name: 'item1'},
        {id: '234iuj3kjk32', url: '2112771129411', name: 'item2'},
        {id: '1232u4iu53iu', url: '2112771129411', name: 'item3'}
      ]).then(
        collects => {
          console.log(collects)
          this.setState({collects, loading: false})
        }
      ).catch(err => console.log(err))
  }

  handleSearchChange = (searchValue) => {
    this.setState({searchValue})
  }

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems})
  }

  handleCollectionDelete = () => {
    console.log('handle Collection delete')
  }

  handleItemDelete = () => {
    console.log('handle item deletion')
  }

  handleModalChange = (isCollection) => {
    this.setState({deleteCollection: isCollection})
    this.setState(({modalActive}) => ({modalActive: !modalActive}))
  }

  handleRestore = () => {
    console.log('handle restore')
  }

  handleSave = () => {
    this.props.onSelect('complete')
  }

  renderItem = (item) => {
    const {id, url, name} = item;
    const media = <Thumbnail customer size="medium" src={url} alt={name} />;

    return (
      <ResourceList.Item
        id={id}
        media={media}
        accessibilityLabel={`Product ${name}`}
        persistActions
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
      </ResourceList.Item>
    );
  }

  renderModal = () => {
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
        onAction: this.handleCollectionDelete,
      },
      text: 'Please confirm the decision to delete these products from this ranked collection.'
    }

    return (
      <Modal
          open={this.state.modalActive}
          onClose={this.handleModalChange}
          title={this.state.deleteCollection ? deleteCollectionModalInfo.title : deleteProductsModalInfo.title}
          primaryAction={this.state.deleteCollection ? deleteCollectionModalInfo.action : deleteProductsModalInfo.action}
        >
          <Modal.Section>
            <TextContainer>
              <p>
                {this.state.deleteCollection ? deleteCollectionModalInfo.text : deleteProductsModalInfo.text}
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
        content: 'Delete customers',
        onAction: () => {this.handleModalChange(false)},
      }
    ]
    const filterControl = (
      <ResourceList.FilterControl
        searchValue={this.state.searchValue}
        onSearchChange={this.handleSearchChange}
      />
    )

    return (
      <React.Fragment>
        {this.renderModal()}
        <Card>
          <ResourceList
            resourceName={resourceName}
            items={this.state.collects}
            renderItem={this.renderItem}
            selectedItems={this.state.selectedItems}
            onSelectionChange={this.handleSelectionChange}
            promotedBulkActions={promotedBulkActions}
            filterControl={filterControl}
            loading={this.state.loading}
          />
        </Card>
        <PageActions
          primaryAction={{ content:'Save', onAction: this.handleSave}}
          secondaryActions={[
            { content: 'Cancel', onAction: () => {this.props.onSelect('landing')}},
            { content: 'Restore', onAction: () => this.handleRestore},
            { content: 'Delete', onAction: () => {this.handleModalChange(true)}}
          ]}
        />
      </React.Fragment>
    );
  }
}
