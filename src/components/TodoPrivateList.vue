<template>
  <!-- IN THIS PAGE, YOU WILL BE LEARN ABOUT CALL GRAPHQL QUERY WITH APOLLO, AND HANDLE LOADING & ERROR STATE -->
  <div>
    <!--access $apollo object to check todos state loading or not  -->
    <div v-if="$apollo.queries.todos.loading">Loading....</div> 
    <!-- element to handle if state error message existing-->
    <div v-if="error">{{ error }}</div> 
    <div class="todoListwrapper">
      <TodoItem 
        v-bind:todos="filteredTodos" 
        v-bind:type="type" 
      />
    </div>
    <TodoFilters 
      v-bind:remainingTodos="remainingTodos" 
      v-bind:filterResults="filterResults" 
      v-bind:filterType="filterType"
      v-bind:type="type"
      v-bind:clearCompleted="clearCompleted"
    />
  </div>
</template>

<script>
import TodoItem from "../components/TodoItem";
import TodoFilters from "../components/TodoFilters";
//import graphql query parser library
import gql from 'graphql-tag'; 

export const GET_MY_TODOS = gql`
  query getMyTodos {
    todos(where: { is_public: { _eq: false} }, order_by: { created_at: desc }) {
      id
      title
      created_at
      is_completed
    }
  }`;

export default {
  components: {
    TodoItem, TodoFilters
  },
  data() {
    return {
      type: "private",
      filterType: "all",
      todos: [],
      error: null, //store error message if exists
    }
  },
  computed: {
    remainingTodos: function() {
      const activeTodos = this.todos !== undefined ? this.todos.filter((todo) => todo.is_completed !== true) : []
      return activeTodos.length
    },
    filteredTodos: function() {
      if (this.filterType === 'all') {
        return this.todos
      } else if(this.filterType === 'active') {
        return this.todos.filter((todo) => todo.is_completed !== true);
      } else if (this.filterType === 'completed') {
        return this.todos.filter((todo) => todo.is_completed === true);
      }
    }
  },
  methods: {
    filterResults: function(type) {
      if(type === 'active') {
        this.filterType = "active";
      } else if(type === 'completed') {
        this.filterType = "completed";
      } else {
        this.filterType = "all";
      }
    },
    clearCompleted: function() {
      const isOk = window.confirm("Are you sure?");
      if (isOk) {
        // Remove all the todos that are completed
        const CLEAR_COMPLETED = gql`
          mutation clearCompleted {
            delete_todos(where: {is_completed: {_eq: true}, is_public: {_eq: false}}) {
              affected_rows
            }
          }
        `;

        this.$apollo.mutate({
          mutation: CLEAR_COMPLETED,
          update: (cache, {data: {delete_todos}}) => {
            if(delete_todos.affected_rows){
              const data = cache.readQuery({
                query: GET_MY_TODOS
              });
              data.todos = data.todos.filter(t => {
                return t.is_completed !== true; //get only data with not todo deleted
              })
              cache.writeQuery({
                query: GET_MY_TODOS,
                data
              });
            }
          }
        }).catch(error => {
          console.error(error);
        });
      }
    }
  },
  //we can use this apollo object directly without import again because provider apollo has loaded in main.js
  apollo: { 
    todos: { //this is will be populate data todos with result of query, this is called SMART QUERY
      query: GET_MY_TODOS,
      error(error){
        //save error on parameter to variable data error
        //error can invalid query or server not respond
        this.error = JSON.stringify(error.message);
      }
    },
  }
}
</script>
