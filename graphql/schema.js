const { buildSchema } = require('graphql');

module.exports = buildSchema(`

type Post{
    id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: String!
    createdAt: String!
    updatedAt: String!
}

type User {
    id: ID!
    name: String!
    email: String!
    status: String!
    posts: [Post!]!
}
 input UserInputData {
     email: String!
     name: String!
     password: String!
 }
    type AuthData {
        userId: String!
        token: String!
    }
    type PostData{
        posts: [Post!]!
        totalPosts: Int!
    }
    input PostInputData{
        title: String!
        content: String!
        imageUrl: String!
    }   
    type RootQuery {
        login(email: String!, password:String!): AuthData!
        posts(page: Int!): PostData!
        post(id: ID!): Post!
        status: String!
    }
    type RootMutation{
        createUser(userInput: UserInputData) : User!
        createPost(postInput: PostInputData): Post!
        updatePost(id: ID!, postInput: PostInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): Boolean
    }
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
