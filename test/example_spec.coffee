require './test_case'

React    = require 'react'
{expect} = require 'chai'

reactUpdates = require '../app'


describe 'Example', ->

  beforeEach ->
    @userStore =
      users:
        '0': 'Dmitri'
      byId: (id) -> @users[id]
      addChangeListener: (cb) -> @_cb = cb
      changed: ->
        @users["0"] = "New Dmitri #{Math.random()}"
        @_cb()

    @ShowUser = ShowUser = React.createClass
      displayName: 'ShowUser'
      mixins: [reactUpdates.contextMixin('userStore')]
      getDefaultProps: -> id: '0'
      onClick: =>
        @userStore.changed()
      render: ->
        mydata = @pluggedIn.userStore.byId @props.id
        <div>
          <div>User Child: {mydata}</div>
          <button onClick=@onClick>Update User</button>
        </div>

    @UserParent = UserParent = React.createClass
      displayName: 'UserParent'
      mixins: [reactUpdates.contextMixin('userStore')]
      getDefaultProps: -> id: '0'
      render: ->
        mydata = @pluggedIn.userStore.byId @props.id
        <div>
          <div>User Parent: {mydata}</div>
          <ShowUser />
        </div>

    app = new reactUpdates.App()
    app.plugInOne 'userStore', @userStore
    React.withContext app.getContext(), =>
      @view = @renderWithContext React, <@UserParent />

  it 'should display the user name', ->
    expect(@view.getDOMNode().textContent).to.contain 'User Child: Dmitri'

  it 'should update on button click', ->
    @simulate.click @oneByTag @view, 'button'
    expect(@view.getDOMNode().textContent).to.contain 'User Child: New Dmitri'

  it 'should display the user name of the parent', ->
    expect(@view.getDOMNode().textContent).to.contain 'User Parent: Dmitri'

  it 'should update on button click', ->
    @simulate.click @oneByTag @view, 'button'
    expect(@view.getDOMNode().textContent).to.contain 'User Parent: New Dmitri'