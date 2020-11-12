<template>
  <div class="formInput">
    <input 
	class="input" 
	placeholder="What needs to be done?" 
	v-model="newTodo"
	@keyup.enter="addTodo"
    />
    <i class="downArrow fa fa-angle-right" />
  </div>
</template>

<script>
  import gpl from 'graphql-tag';
  import { GET_MY_TODOS } from './TodoPrivateList.vue'; //get query todos
  //create graphql query with mutation , and we must pass variable $todo and $isPublic to use this query
  const ADD_TODO = gpl`
    mutation insert_todos($todo: String!, $isPublic: Boolean!) {
      insert_todos(objects: {title: $todo, is_public: $isPublic}) {
        affected_rows
        returning {
          id
          title
          created_at
          is_completed
          is_public
        }
      }
    }`;

  export default {
    props: ['type'],
    data() {
      return {
        newTodo: '',
      }
    },
    methods: {
      addTodo: function () {
        // insert new todo into db
        const title = this.newTodo && this.newTodo.trim();
        const isPublic = this.type === "public" ? true : false; //type variable from TodoPrivateList.vue and TodoPublicList.vue
        //call apollo object with $apollo to use mutation
        this.$apollo.mutate({
          mutation: ADD_TODO,
          variables: {
            todo : title,
            isPublic : isPublic
          },
          //update() function execute after mutation finished , cache param is current data on database,
          //second param is data insert_todos result of mutation
          update: (cache, { data: { insert_todos }}) => {
            //Read the data from our cache for this query
            console.log(insert_todos);
            try {
              if(this.type === "private"){ //check if inserted in private 
                const data = cache.readQuery({  //cache.readQuery() not contact GraphQL server, but read from local cache 
                  query : GET_MY_TODOS
                });
                const insertedTodo = insert_todos.returning; //extract new todo from response mutate
                data.todos.splice(0,0,insertedTodo[0]); //update todos variable with new inserted todo
                cache.writeQuery({ //cache.writeQuery() will be update data on local cache, not in GraphQL server, so UI can change
                  query: GET_MY_TODOS,
                  data
                });
                //after this TodoPrivateList component using the apollo object with same query will be get the updated todo list
                //as its automatically subscribed to the store (local cache)
              }
            } catch(e){
              console.error(e);
            }
          }
        })
        
        this.newTodo = '';
      },
    }
  }
</script>
