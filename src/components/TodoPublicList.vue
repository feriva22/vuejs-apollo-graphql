<template>
  <div>
    <div class="todoListwrapper">
      <div class="loadMoreSection" v-if="newTodosCount" v-on:click="loadMoreClicked">
        New tasks have arrived! ({{ newTodosCount }})
      </div>
      <TodoItem 
        v-bind:todos="todos" 
        v-bind:type="type" 
      />
      <div class="loadMoreSection" v-if="olderTodosAvailable" v-on:click="loadOlderClicked">
        Load older tasks
      </div>
    </div>
  </div>
</template>

<script>
import TodoItem from "../components/TodoItem";
import TodoFilters from "../components/TodoFilters";
import gql from 'graphql-tag';

const NOTIFY_NEW_PUBLIC_TODOS = gql`
  subscription notifyNewPublicTodos{
    todos (
      where: { is_public: { _eq : true}}
      order_by: { created_at: desc}
      limit: 1 
    ){
      id
      title
      created_at
    }
  }
`;

const GET_OLD_PUBLIC_TODOS = gql`
   query getOldPublicTodos($oldestTodoId: Int) {
     todos(
       where: { is_public: { _eq: true }, id: { _lt: $oldestTodoId } }
       limit: 7
       order_by: { created_at: desc }
     ) {
       id
       title
       created_at
       is_public
       user {
         name
       }
     }
   }
 `;

const GET_NEW_PUBLIC_TODOS = gql`
  query getNewPublicTodos($latestVisibleId: Int!){
    todos(
      where: { is_public: { _eq: true}, id: { _gt: $latestVisibleId}}
      order_by: { created_at : desc}
    ){
      id
      title
      created_at
      is_public
      user {
        name
      }
    }
  }
`;

export default {
  components: {
    TodoItem, TodoFilters
  },
  data: function() {
    return {
      olderTodosAvailable: true,
      newTodosCount: 0,
      limit: 7,
      todos: [],
      type: "public"
    }
  },
  mounted() {
    const that = this;
    this.$apollo.query({
      query: GET_OLD_PUBLIC_TODOS //get 7 new data 
    })
    .then(data => { //after load 7 new data subscribe for new data 
      this.todos = data.data.todos; //update current list of todos
      //start subscription
      this.$apollo.subscribe({            //subscribe for new public todos
        query: NOTIFY_NEW_PUBLIC_TODOS,
      })
      .subscribe({  //subscribe when new data arrived
        next(data) { //get data
          if(data.data.todos.length){ //if data length is not 0 
            //check if the received todo has present
            if(data.data.todos[0].id !== that.todos[0].id){ //if has new data check if current list todos newest is not same with new todos
              that.newTodosCount = that.newTodosCount + data.data.todos.length; //update todos public count
            }
          }
        },
        error(err){
          console.error(err);
        }
      })
    })
  },
  methods: {
    loadMoreClicked: function() {
      this.newTodosCount = 0; //reset when click load new todos
      this.$apollo.query({
        query: GET_NEW_PUBLIC_TODOS,
        variables: {
          latestVisibleId: this.todos.length ? this.todos[0].id : null
        },
      }).then(data => {
        if(data.data.todos.length){
          const mergedTodos = data.data.todos.concat(this.todos);
          //update current list of todos
          this.todos = mergedTodos;
        }
      })

    },
    loadOlderClicked: function() {
      this.$apollo.query({
        query: GET_OLD_PUBLIC_TODOS,
        variables: {
          oldestTodoId: this.todos.length ? this.todos[this.todos.length - 1].id : null
        }
      })
      .then(data => {
        if(data.data.todos.length){
          const mergedTodos = this.todos.concat(data.data.todos);
          //update state with new todos
          this.todos = mergedTodos;
        } else {
          this.olderTodosAvailable = false;
        }
      })
    },
  }
}
</script>
