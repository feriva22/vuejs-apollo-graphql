<template>
  <ul>
    <li v-for="todo in todos" v-bind:key="todo.id">
      <div v-if="todo.is_public" class="userInfoPublic">
        @{{ todo.user.name }}
      </div>
      <div class="view" v-if="type === 'private'">
        <div v-if="todo.is_completed" class="round">
          <input type="checkbox" id="todo.id" checked="true" />
          <label v-on:click="handleTodoToggle(todo)" htmlFor="todo.id"></label>
        </div>
        <div v-else class="round">
          <input type="checkbox" id="todo.id" />
          <label v-on:click="handleTodoToggle(todo)" htmlFor="todo.id"></label>
        </div>
      </div>
      <div class="labelContent">
        <strike class="todoLabel" v-if="todo.is_completed">
          <div>
            {{ todo.title }}
          </div>
        </strike>
        <div v-else>
          {{ todo.title }}
        </div>
      </div>
      <button
        v-if="type === 'private'"
        v-on:click="handleTodoDelete(todo)"
        class="closeBtn"
      >
        x
      </button>
    </li>
  </ul>
</template>

<script>
import gpl from "graphql-tag";
import { GET_MY_TODOS } from "./TodoPrivateList.vue";

//create graphql mutation for update status of todo in db
const TOGGLE_TODO = gpl`
    mutation update_todos($id: Int!, $isCompleted: Boolean!){
      update_todos(where: { id : {_eq: $id}}, _set: { is_completed: $isCompleted}){
        affected_rows
      }
    }
  `;
//create graphql mutation for delte todo in db
const DELETE_TODO = gpl`
  mutation delete_todos ($id: Int!) {
    delete_todos(where: {id: {_eq: $id}}) {
      affected_rows
    }
  }
`;

export default {
  props: ["todos", "type"],
  methods: {
    handleTodoToggle: function (todo) {
      // eslint-disable-line
      // update todo data in db here
      this.$apollo.mutate({
        //call $apollo.mutate() for update data
        mutation: TOGGLE_TODO,
        variables: {
          id: todo.id,
          isCompleted: !todo.is_completed, //state is otherwise
        },
        update: (store, { data: { update_todos } }) => {
          if (update_todos.affected_rows) {
            //if affected_rows not 0
            if (this.type === "private") {
              // Read the data from our cache for this query.
              const data = store.readQuery({
                query: GET_MY_TODOS,
              });
              const toggledTodo = data.todos.find((t) => t.id === todo.id); //get todo with same with id edited todo
              toggledTodo.is_completed = !todo.is_completed; //change state completed
              store.writeQuery({ //write todo state to local cache
                query: GET_MY_TODOS,
                data,
              });
            }
          }
        },
        optimisticResponse: { //add this optimisticResponse for create fake response so no lag on update ui, 
          __typename: 'Mutation',
          update_todos: {
            __typename: 'todos',
            id: todo.id,
            is_completed: !todo.is_completed, //in this response we create predictive result before actual response from server
            affected_rows: 1
          }
        }
      });
    },
    handleTodoDelete: function (todo) {
      // eslint-disable-line
      // delete todo from db
      this.$apollo.mutate({
        mutation: DELETE_TODO,
        variables: {
          id: todo.id
        },
        update: (store, {data: {delete_todos}}) => {
          if(delete_todos.affected_rows){
            if (this.type === "private") {
              // Read the data from our cache for this query.
              const data = store.readQuery({
                query: GET_MY_TODOS,
              });
              data.todos = data.todos.filter(t => {
                return t.id !== todo.id; //get only data with not todo deleted
              })
              store.writeQuery({ //write todo state to local cache
                query: GET_MY_TODOS,
                data,
              });
            }
          }
        }
      })
    },
  },
};
</script>
